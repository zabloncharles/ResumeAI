import admin from "firebase-admin";
import {
  buildAtsCheckSystemMessage,
  buildAtsCheckUserMessage,
} from "../../shared/atsCheckPrompt.js";

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
  } catch (err) {
    console.error("verifyIdToken failed:", err?.message || err);
    return null;
  }
}

function parseAtsResult(raw) {
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
      body: JSON.stringify({
        error:
          "Unauthorized. Sign in again, or check Firebase Admin credentials on the server.",
      }),
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

  const { resumeData, resumePayload, templateId, templateName } = body || {};
  const payload =
    resumePayload && typeof resumePayload === "object"
      ? resumePayload
      : resumeData && typeof resumeData === "object"
        ? { resume: resumeData, exportContext: null }
        : null;
  if (!payload?.resume || typeof payload.resume !== "object") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Resume data is required." }),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "OpenAI API key not configured" }),
    };
  }

  const tid = templateId || "harvard-mcs";
  const redactedPayload = {
    ...payload,
    resume: {
      ...payload.resume,
      personalInfo: {
        ...(payload.resume.personalInfo || {}),
        fullName: "",
        phone: "",
        photo: "",
      },
    },
    exportContext: {
      ...(payload.exportContext && typeof payload.exportContext === "object"
        ? payload.exportContext
        : {}),
      ivyPdfIncludesPhoto: false,
      atsPayloadOmitsFullNameAndPhone: true,
    },
  };
  const systemContent = buildAtsCheckSystemMessage(tid);
  const userContent = buildAtsCheckUserMessage(
    redactedPayload,
    tid,
    templateName
  );

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
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: errorData.error?.message || "Failed to run ATS check",
        }),
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = parseAtsResult(content);
    if (!parsed) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Could not parse ATS check response. Try again.",
        }),
      };
    }

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

    return {
      statusCode: 200,
      body: JSON.stringify({ result: parsed, total_tokens }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Failed to run ATS check",
      }),
    };
  }
};
