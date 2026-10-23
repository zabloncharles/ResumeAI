import admin from "firebase-admin";
import { recordUserAiUsage } from "../../shared/recordUserAiUsage.js";
import { loadPodcastVoiceOptions } from "../../shared/loadPodcastVoiceOptions.js";

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
const DEFAULT_MODEL = "gemini-3.8-flash-lite-tts";
const DEFAULT_SAMPLE_RATE = 24000;

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

function speakingStyle(voiceOptions, emotion, mannerism) {
  const {
    podcastEmotionLabel,
    podcastEmotionHint,
    podcastMannerismLabel,
    podcastMannerismHint,
  } = voiceOptions;

  if (mannerism === "urban") {
    return [
      `Emotion: ${podcastEmotionLabel(emotion)}. ${podcastEmotionHint(emotion)}`,
      `Mannerism: ${podcastMannerismLabel(mannerism)}. ${podcastMannerismHint(mannerism)}`,
      "Speak like a blunt urban tutor talking to someone who knows nothing.",
      "Use slang cadence. Occasional swearing is fine when it lands naturally.",
      "Keep teaching clear and accurate. Roast the basics, then make the idea stick.",
    ].join(" ");
  }

  if (mannerism === "caveman") {
    return [
      `Emotion: ${podcastEmotionLabel(emotion)}. ${podcastEmotionHint(emotion)}`,
      `Mannerism: ${podcastMannerismLabel(mannerism)}. ${podcastMannerismHint(mannerism)}`,
      "Speak in caveman style telegraphic English.",
      "Short broken sentences. Slow, punchy, and clear.",
      "Say real concept names clearly, then explain them with tiny kid words. Do not skip the real terms. Repeat so the idea sticks.",
    ].join(" ");
  }

  return [
    `Emotion: ${podcastEmotionLabel(emotion)}. ${podcastEmotionHint(emotion)}`,
    `Mannerism: ${podcastMannerismLabel(mannerism)}. ${podcastMannerismHint(mannerism)}`,
    "Speak as a natural human teacher for one listener.",
    "Calm, clear, and steady. Pause briefly between sentences.",
    "Match the emotion and mannerism without sounding theatrical.",
  ].join(" ");
}

function extractAudioBase64(payload) {
  if (payload?.output_audio?.data) return payload.output_audio.data;

  const steps = Array.isArray(payload?.steps) ? payload.steps : [];
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    if (step?.type !== "model_output") continue;
    const content = Array.isArray(step.content) ? step.content : [];
    for (let j = content.length - 1; j >= 0; j--) {
      const part = content[j];
      if (part?.type === "audio" && typeof part.data === "string" && part.data) {
        return part.data;
      }
    }
  }

  return null;
}

function extractPcmFromAudioBuffer(buffer) {
  if (buffer.length >= 12) {
    const riff = buffer.toString("ascii", 0, 4);
    const wave = buffer.toString("ascii", 8, 12);
    if (riff === "RIFF" && wave === "WAVE") {
      let offset = 12;
      while (offset + 8 <= buffer.length) {
        const chunkId = buffer.toString("ascii", offset, offset + 4);
        const chunkSize = buffer.readUInt32LE(offset + 4);
        const dataStart = offset + 8;
        if (chunkId === "data") {
          return buffer.subarray(dataStart, dataStart + chunkSize);
        }
        offset = dataStart + chunkSize + (chunkSize % 2);
      }
    }
  }
  return buffer;
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

  const voiceOptions = await loadPodcastVoiceOptions();
  const {
    normalizePodcastEmotion,
    normalizePodcastMannerism,
    normalizePodcastVoice,
  } = voiceOptions;

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const emotion = normalizePodcastEmotion(body?.emotion ?? body?.manner);
  const mannerism = normalizePodcastMannerism(
    body?.mannerism ?? body?.manner
  );
  const voice = normalizePodcastVoice(
    body?.voice || process.env.GEMINI_TTS_VOICE
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Gemini API key not configured" }),
    };
  }

  const model = process.env.GEMINI_TTS_MODEL || DEFAULT_MODEL;
  const sampleRate = Number(process.env.GEMINI_TTS_SAMPLE_RATE) || DEFAULT_SAMPLE_RATE;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model,
          input: [
            {
              type: "user_input",
              content: [
                {
                  type: "text",
                  text,
                  annotations: [
                    {
                      type: "speech_metadata",
                      style: speakingStyle(voiceOptions, emotion, mannerism),
                    },
                  ],
                },
              ],
            },
          ],
          response_format: {
            type: "audio",
            mime_type: "audio/l16",
            sample_rate: sampleRate,
          },
          generation_config: {
            speech_config: [{ voice }],
          },
        }),
      }
    );

    const raw = await response.text();
    let payload = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.message ||
        `Gemini TTS failed (${response.status}).`;
      return {
        statusCode: 500,
        body: JSON.stringify({ error: message }),
      };
    }

    const audioBase64 = extractAudioBase64(payload);
    if (!audioBase64) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Gemini TTS returned no audio data.",
        }),
      };
    }

    const audioBuffer = extractPcmFromAudioBuffer(
      Buffer.from(audioBase64, "base64")
    );
    const pcmBase64 = audioBuffer.toString("base64");

    await recordUserAiUsage(admin, uid, Math.ceil(text.length / 4));

    return {
      statusCode: 200,
      body: JSON.stringify({
        audioBase64: pcmBase64,
        contentType: "audio/l16",
        sampleRate,
        channels: 1,
        bitDepth: 16,
        voice,
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
