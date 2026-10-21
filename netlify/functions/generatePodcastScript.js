import admin from "firebase-admin";
import { recordUserAiUsage } from "../../shared/recordUserAiUsage.js";
import {
  normalizeStudyCategoryId,
  studyCategoryIdsPromptList,
} from "../../shared/studyCategoryIds.js";
import {
  normalizePodcastEmotion,
  normalizePodcastMannerism,
  podcastEmotionHint,
  podcastMannerismHint,
  podcastEmotionLabel,
  podcastMannerismLabel,
} from "../../shared/podcastVoiceOptions.js";

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

const MAX_INPUT_CHARS = 48000;

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

function voiceStyleInstructions(emotion, mannerism) {
  return [
    `Emotion: ${podcastEmotionLabel(emotion)}. ${podcastEmotionHint(emotion)}`,
    `Mannerism: ${podcastMannerismLabel(mannerism)}. ${podcastMannerismHint(mannerism)}`,
    "Write the script so wording and pacing match that emotion and mannerism.",
    "Do not name the emotion or mannerism out loud in the script.",
  ].join(" ");
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

  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const emotion = normalizePodcastEmotion(body?.emotion ?? body?.manner);
  const mannerism = normalizePodcastMannerism(
    body?.mannerism ?? body?.manner
  );

  if (!content) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No content provided." }),
    };
  }

  if (content.length < 80) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Content is too short. Paste more material to teach from.",
      }),
    };
  }

  if (content.length > MAX_INPUT_CHARS) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Content is too long (max ${MAX_INPUT_CHARS} characters).`,
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

  const categoryIds = studyCategoryIdsPromptList();

  const system = [
    "You write a single-voice teaching podcast script for text-to-speech.",
    "One host speaks to the listener (use “you”).",
    "Write plain conversational speech: short sentences, contractions, everyday words.",
    "Skip radio-host greetings and hype openers. Start in a natural way, then teach.",
    "Do not use ellipses, em dashes for drama, or stagey filler like “so…” and “anyway…”.",
    "Use normal periods and commas only. One idea per sentence when possible.",
    "Separate thoughts with paragraph breaks (blank lines), not gimmicky punctuation.",
    "No stage directions, speaker labels, markdown, or pause tags.",
    "Do not invent facts beyond the source. If the source is thin, stay high-level.",
    "Also pick the single best subject categoryId for the source material from the allowed list only.",
    voiceStyleInstructions(emotion, mannerism),
    "Return JSON only.",
  ].join(" ");

  const userPrompt = `Create a podcast teaching script from this material.

Pick categoryId from this allowed list only (exact id strings):
${categoryIds}

Return JSON:
{
  "title": "short episode title",
  "categoryId": "one allowed id from the list above",
  "script": "spoken script for one host, plain and conversational"
}

Source material:
---
${content}
---`;

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
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
    await recordUserAiUsage(admin, uid, total_tokens);

    const parsed = extractJsonObject(aiResponse);
    const title =
      String(parsed?.title || "Teaching podcast").trim() || "Teaching podcast";
    const script = String(parsed?.script || "").trim();
    const categoryId = normalizeStudyCategoryId(parsed?.categoryId);

    if (!script || script.length < 40) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "AI did not return a usable podcast script. Try again.",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        title,
        script,
        categoryId,
        emotion,
        mannerism,
        total_tokens,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to generate podcast script",
      }),
    };
  }
};
