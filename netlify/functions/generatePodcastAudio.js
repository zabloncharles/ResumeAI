import admin from "firebase-admin";
import { recordUserAiUsage } from "../../shared/recordUserAiUsage.js";
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

const MAX_TTS_CHARS = 4000;
const VOICE = "onyx";

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

function speakingInstructions(emotion, mannerism) {
  return [
    `Emotion: ${podcastEmotionLabel(emotion)}. ${podcastEmotionHint(emotion)}`,
    `Mannerism: ${podcastMannerismLabel(mannerism)}. ${podcastMannerismHint(mannerism)}`,
    "Speak as a natural human teacher for one listener.",
    "Calm, clear, and steady. Pause briefly between sentences.",
    "Match the emotion and mannerism without sounding theatrical.",
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

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const emotion = normalizePodcastEmotion(body?.emotion ?? body?.manner);
  const mannerism = normalizePodcastMannerism(
    body?.mannerism ?? body?.manner
  );

  if (!text) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No text provided for speech." }),
    };
  }

  if (text.length > MAX_TTS_CHARS) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Text chunk is too long for TTS (max ${MAX_TTS_CHARS} characters).`,
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

  const model =
    process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts-2025-12-15";

  try {
    const payload = {
      model,
      voice: VOICE,
      input: text,
      response_format: "mp3",
    };

    if (model.includes("gpt-4o-mini-tts")) {
      payload.instructions = speakingInstructions(emotion, mannerism);
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: errorData.error?.message || "Failed to generate speech",
        }),
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

    await recordUserAiUsage(admin, uid, Math.ceil(text.length / 4));

    return {
      statusCode: 200,
      body: JSON.stringify({
        audioBase64,
        contentType: "audio/mpeg",
        voice: VOICE,
        model,
        emotion,
        mannerism,
        charCount: text.length,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to generate podcast audio",
      }),
    };
  }
};
