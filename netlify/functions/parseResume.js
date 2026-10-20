import admin from "firebase-admin";
import {
  buildParseResumeSystemMessage,
  buildParseResumeUserPrompt,
} from "../../shared/ivyAiGuidelines.js";
import {
  normalizeParsedResume,
  resumeDataJsonSchemaDescription,
} from "../../shared/normalizeParsedResume.js";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    }),
  });
}

const MAX_INPUT_CHARS = 28000;

function getAuthorizationHeader(event) {
  const headers = event.headers || {};
  return (
    headers.authorization ||
    headers.Authorization ||
    headers["Authorization"] ||
    ""
  );
}

async function verifyIdToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const idToken = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

function extractJsonObject(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const uid = await verifyIdToken(getAuthorizationHeader(event));
  if (!uid) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  const { text, templateId: rawTemplateId } = body || {};
  const templateId = rawTemplateId || "harvard-mcs";
  const trimmedText = typeof text === "string" ? text.trim() : "";

  if (!trimmedText) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No resume text provided." }),
    };
  }

  if (trimmedText.length > MAX_INPUT_CHARS) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Resume text is too long (max ${MAX_INPUT_CHARS} characters).`,
      }),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "OpenAI API key not configured" }),
    };
  }

  const schema = resumeDataJsonSchemaDescription();
  const prompt = buildParseResumeUserPrompt(schema, trimmedText, templateId);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: buildParseResumeSystemMessage(templateId),
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: errorData.error?.message || "Failed to contact OpenAI",
        }),
      };
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    const total_tokens = data.usage?.total_tokens || 0;

    try {
      await admin
        .firestore()
        .collection("users")
        .doc(uid)
        .update({
          totalTokens: admin.firestore.FieldValue.increment(total_tokens),
        });
    } catch (e) {
      console.error("Failed to increment totalTokens", e);
    }

    const parsed = extractJsonObject(aiResponse);
    if (!parsed) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI did not return valid JSON." }),
      };
    }

    const resume = normalizeParsedResume(parsed);

    return {
      statusCode: 200,
      body: JSON.stringify({ resume, total_tokens }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to parse resume",
      }),
    };
  }
};
