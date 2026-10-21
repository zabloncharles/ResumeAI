import admin from "firebase-admin";
import { recordUserAiUsage } from "../../shared/recordUserAiUsage.js";
import {
  normalizeStudyCategoryId,
  studyCategoryIdsPromptList,
} from "../../shared/studyCategoryIds.js";

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
const DEPTH_MODES = new Set(["high-level", "detailed"]);

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

function normalizeDifficulty(value) {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  return "medium";
}

function normalizeCards(parsed, maxCards) {
  const list = Array.isArray(parsed?.cards)
    ? parsed.cards
    : Array.isArray(parsed?.flashcards)
      ? parsed.flashcards
      : [];

  return list
    .filter((card) => card && typeof card === "object")
    .map((card) => ({
      front: String(card.front ?? card.question ?? "").trim(),
      back: String(card.back ?? card.answer ?? "").trim(),
      category: String(card.category ?? "").trim(),
      difficulty: normalizeDifficulty(card.difficulty),
    }))
    .filter((card) => card.front && card.back)
    .slice(0, maxCards);
}

function buildSystemMessage(depth, chunkIndex, chunkCount) {
  const multi =
    chunkCount > 1
      ? ` This is part ${chunkIndex} of ${chunkCount} of a longer transcript. Cover only this part. Avoid repeating generic intro/outro cards.`
      : "";

  if (depth === "detailed") {
    const aim =
      chunkCount > 1
        ? "Aim for 10–18 high-quality cards from this part."
        : "Aim for 20–40 high-quality cards.";
    return [
      "You create study flashcards from a YouTube video transcript.",
      "Mode: DETAILED — cover specific facts, definitions, named concepts, steps, numbers, and nuanced claims.",
      aim,
      "Prefer precise Q&A over vague prompts.",
      "Use only information present in the transcript. Do not invent facts.",
      multi,
      "Return JSON only.",
    ].join(" ");
  }

  const aim =
    chunkCount > 1
      ? "Aim for 5–10 cards from this part."
      : "Aim for 8–15 cards.";

  return [
    "You create study flashcards from a YouTube video transcript.",
    "Mode: HIGH LEVEL — focus on main themes, core definitions, and big-picture takeaways.",
    aim,
    "Skip minor asides and filler.",
    "Use only information present in the transcript. Do not invent facts.",
    multi,
    "Return JSON only.",
  ].join(" ");
}

function buildUserPrompt({ transcript, depth, title, chunkIndex, chunkCount }) {
  const titleLine = title ? `Suggested video title: ${title}\n\n` : "";
  const partLine =
    chunkCount > 1 ? `Transcript part: ${chunkIndex} of ${chunkCount}\n\n` : "";
  const categoryIds = studyCategoryIdsPromptList();

  return `${titleLine}${partLine}Depth mode: ${depth}

Pick the single best subject for this transcript as categoryId.
Allowed categoryId values (use exact id strings only):
${categoryIds}
Use "general" only if nothing else fits.

Return a JSON object with this shape:
{
  "title": "short study set title",
  "description": "one sentence summary",
  "categoryId": "one allowed id from the list above",
  "cards": [
    {
      "front": "question or prompt",
      "back": "answer",
      "category": "optional topic tag",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Transcript:
---
${transcript}
---`;
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

  const transcript =
    typeof body?.transcript === "string" ? body.transcript.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const depth = DEPTH_MODES.has(body?.depth) ? body.depth : "high-level";
  const chunkCount = Math.max(1, Number(body?.chunkCount) || 1);
  const chunkIndex = Math.min(
    chunkCount,
    Math.max(1, Number(body?.chunkIndex) || 1)
  );

  if (!transcript) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No transcript provided." }),
    };
  }

  if (transcript.length < 80) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Transcript is too short. Paste more of the video transcript.",
      }),
    };
  }

  if (transcript.length > MAX_INPUT_CHARS) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Transcript chunk is too long (max ${MAX_INPUT_CHARS} characters per part).`,
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

  const maxCards = depth === "detailed" ? (chunkCount > 1 ? 18 : 60) : chunkCount > 1 ? 12 : 30;

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
            content: buildSystemMessage(depth, chunkIndex, chunkCount),
          },
          {
            role: "user",
            content: buildUserPrompt({
              transcript,
              depth,
              title,
              chunkIndex,
              chunkCount,
            }),
          },
        ],
        temperature: 0.3,
        max_tokens: depth === "detailed" ? 8192 : 4096,
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
    if (!parsed) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI did not return valid JSON." }),
      };
    }

    const cards = normalizeCards(parsed, maxCards);
    if (!cards.length) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "AI did not return any usable flashcards. Try again.",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        title:
          String(parsed.title || title || "YouTube study set").trim() ||
          "YouTube study set",
        description: String(parsed.description || "").trim(),
        categoryId: normalizeStudyCategoryId(parsed.categoryId),
        cards,
        depth,
        chunkIndex,
        chunkCount,
        total_tokens,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to generate study cards",
      }),
    };
  }
};
