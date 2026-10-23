import admin from "firebase-admin";
import { recordUserAiUsage } from "../../shared/recordUserAiUsage.js";
import {
  normalizeStudyCategoryId,
  studyCategoryIdsPromptList,
} from "../../shared/studyCategoryIds.js";
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

function voiceStyleInstructions(voiceOptions, emotion, mannerism) {
  const {
    podcastEmotionLabel,
    podcastEmotionHint,
    podcastMannerismLabel,
    podcastMannerismHint,
  } = voiceOptions;

  const base = [
    `Emotion: ${podcastEmotionLabel(emotion)}. ${podcastEmotionHint(emotion)}`,
    `Mannerism: ${podcastMannerismLabel(mannerism)}. ${podcastMannerismHint(mannerism)}`,
    "Write the script so wording and pacing match that emotion and mannerism.",
    "Do not name the emotion or mannerism out loud in the script.",
  ];

  if (mannerism === "urban") {
    base.push(
      "Urban mode: use modern slang and street-casual phrasing.",
      "You may swear when it fits the vibe (keep it natural, not constant).",
      "Teach like the listener is clueless: blunt, roasting, over-explain the basics, then make the idea stick.",
      "Still teach accurate facts from the source. Do not invent facts."
    );
  }

  if (mannerism === "caveman") {
    base.push(
      "Caveman mode: write caveman style telegraphic English.",
      "Short primitive sentences. Broken grammar. Repetitive phrasing. Prefer third person (like Hulk speak).",
      "Keep the real concepts, feature names, and important terms from the source. Do not drop them or invent softer replacements that lose the real idea.",
      "Say the real name first, then define it with tiny words a 5 year old understands. Example: Photosynthesis. That mean plant make food from sun light.",
      "Teach every real feature and idea from the source this way. Keep facts true. No big unexplained words left hanging."
    );
  }

  return base.join(" ");
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
  const { normalizePodcastEmotion, normalizePodcastMannerism } = voiceOptions;

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

  const urban = mannerism === "urban";
  const caveman = mannerism === "caveman";
  const system = [
    "You write a single-voice teaching podcast script for text-to-speech.",
    caveman
      ? "One host teaches the listener in third person caveman speak when it fits."
      : "One host speaks to the listener (use “you”).",
    caveman
      ? "Speak in caveman style telegraphic English. Short broken sentences. Third person. Repeat ideas. Keep real concept names and feature names from the source. Always say the real name, then explain it with tiny 5 year old words so nothing important is lost. Example: Photosynthesis. That mean plant make food from sun light. Plant eat light. Plant grow big."
      : urban
        ? "Write like a blunt urban tutor: slang, contractions, short punches, occasional swearing OK."
        : "Write plain conversational speech: short sentences, contractions, everyday words.",
    "Skip radio-host greetings and hype openers. Start in a natural way, then teach.",
    urban || caveman
      ? "Punctuation can be punchy, but no stage directions, speaker labels, markdown, or pause tags."
      : "Do not use ellipses, em dashes for drama, or stagey filler like “so…” and “anyway…”.",
    "Use normal periods and commas. One idea per sentence when possible.",
    "Separate thoughts with paragraph breaks (blank lines), not gimmicky punctuation.",
    urban || caveman
      ? null
      : "No stage directions, speaker labels, markdown, or pause tags.",
    "Do not invent facts beyond the source. If the source is thin, stay high-level.",
    "Also pick the single best subject categoryId for the source material from the allowed list only.",
    voiceStyleInstructions(voiceOptions, emotion, mannerism),
    "Return JSON only.",
  ]
    .filter(Boolean)
    .join(" ");

  const scriptShape = caveman
    ? "spoken script in caveman style telegraphic English that keeps real concept names then defines them in tiny 5 year old words"
    : "spoken script for one host, plain and conversational";

  const userPrompt = `Create a podcast teaching script from this material.

Pick categoryId from this allowed list only (exact id strings):
${categoryIds}

Return JSON:
{
  "title": "short episode title",
  "categoryId": "one allowed id from the list above",
  "script": "${scriptShape}"
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
