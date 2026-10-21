import type { ResumeData } from "../types/ResumeData";
import type {
  AtsCheckResult,
  AtsRecommendation,
  AtsRecommendationSeverity,
} from "../types/atsCheck";
import {
  chunkTranscript,
  dedupeStudyCards,
  TRANSCRIPT_MAX_CHARS,
} from "./transcriptChunks";
import { resolveStudyCategoryId } from "../constants/studyCategories";
import type {
  PodcastEmotion,
  PodcastMannerism,
} from "../constants/podcastVoiceOptions";
import {
  DEFAULT_PODCAST_EMOTION,
  DEFAULT_PODCAST_MANNERISM,
  normalizePodcastEmotion,
  normalizePodcastMannerism,
} from "../constants/podcastVoiceOptions";
import { chunkPodcastScript } from "./podcastScriptChunks";

export type { PodcastEmotion, PodcastMannerism };

type GenerateResumePayload = {
  prompt: string;
  profession?: string;
  section?: string | null;
  summary?: string;
  templateId?: string;
};

type AtsCheckPayload = {
  resumePayload: {
    resume: ResumeData;
    exportContext: Record<string, unknown>;
  };
  templateId: string;
  templateName?: string;
};

function aiFunctionUrl(name: string): string {
  const base = import.meta.env.VITE_AI_FUNCTIONS_BASE?.replace(/\/$/, "");
  if (base) {
    return `${base}/${name}`;
  }
  return `/.netlify/functions/${name}`;
}

export function generateResumeFunctionUrl(): string {
  return aiFunctionUrl("generateResume");
}

export function atsCheckFunctionUrl(): string {
  return aiFunctionUrl("atsCheckResume");
}

export function parseResumeFunctionUrl(): string {
  return aiFunctionUrl("parseResume");
}

export type StudyTranscriptDepth = "high-level" | "detailed";

export type GeneratedStudyCard = {
  front: string;
  back: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
};

export function generateStudyCardsFromTranscriptUrl(): string {
  return aiFunctionUrl("generateStudyCardsFromTranscript");
}

export async function postGenerateStudyCardsFromTranscriptChunk(
  token: string,
  payload: {
    transcript: string;
    depth: StudyTranscriptDepth;
    title?: string;
    chunkIndex?: number;
    chunkCount?: number;
  }
): Promise<{
  title: string;
  description: string;
  categoryId?: string;
  cards: GeneratedStudyCard[];
  depth: StudyTranscriptDepth;
  total_tokens?: number;
}> {
  const response = await fetch(generateStudyCardsFromTranscriptUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data: {
    error?: string;
    title?: string;
    description?: string;
    categoryId?: string;
    cards?: GeneratedStudyCard[];
    depth?: StudyTranscriptDepth;
    total_tokens?: number;
  } = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (response.status === 404) {
      throw new Error(
        "Study card generation is not running. Use “npm run dev:netlify” locally, or use the deployed site."
      );
    }
    throw new Error(
      response.ok
        ? "Invalid response from study card generation."
        : `Study card generation failed (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error || `Study card generation failed (${response.status}).`
    );
  }

  if (!Array.isArray(data.cards) || data.cards.length === 0) {
    throw new Error("Could not generate flashcards. Try again.");
  }

  return {
    title: data.title || "YouTube study set",
    description: data.description || "",
    categoryId: data.categoryId,
    cards: data.cards,
    depth: data.depth === "detailed" ? "detailed" : "high-level",
    total_tokens: data.total_tokens,
  };
}

export async function postGenerateStudyCardsFromTranscript(
  token: string,
  payload: {
    transcript: string;
    depth: StudyTranscriptDepth;
    title?: string;
  },
  onProgress?: (current: number, total: number) => void
): Promise<{
  title: string;
  description: string;
  categoryId: string;
  cards: GeneratedStudyCard[];
  depth: StudyTranscriptDepth;
  total_tokens?: number;
  chunksProcessed: number;
}> {
  const trimmed = payload.transcript.trim();
  if (trimmed.length > TRANSCRIPT_MAX_CHARS) {
    throw new Error(
      `Transcript is too long (max ${TRANSCRIPT_MAX_CHARS.toLocaleString()} characters). Trim it or split the video.`
    );
  }

  const chunks = chunkTranscript(trimmed);
  if (!chunks.length) {
    throw new Error("No transcript provided.");
  }

  const allCards: GeneratedStudyCard[] = [];
  const descriptions: string[] = [];
  const categoryVotes = new Map<string, number>();
  let title = payload.title?.trim() || "YouTube study set";
  let totalTokens = 0;

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i + 1, chunks.length);
    const part = await postGenerateStudyCardsFromTranscriptChunk(token, {
      transcript: chunks[i],
      depth: payload.depth,
      title: payload.title,
      chunkIndex: i + 1,
      chunkCount: chunks.length,
    });
    if (i === 0 && part.title) title = part.title;
    if (part.description) descriptions.push(part.description);
    if (part.categoryId) {
      categoryVotes.set(
        part.categoryId,
        (categoryVotes.get(part.categoryId) || 0) + 1
      );
    }
    allCards.push(...part.cards);
    totalTokens += part.total_tokens || 0;
  }

  const cards = dedupeStudyCards(allCards).slice(0, 80);
  if (!cards.length) {
    throw new Error("Could not generate flashcards. Try again.");
  }

  let categoryId = "general";
  let bestVotes = 0;
  for (const [id, votes] of categoryVotes) {
    if (votes > bestVotes && id !== "general") {
      categoryId = id;
      bestVotes = votes;
    }
  }
  if (bestVotes === 0 && categoryVotes.has("general")) {
    categoryId = "general";
  } else if (bestVotes === 0 && categoryVotes.size > 0) {
    categoryId = categoryVotes.keys().next().value || "general";
  }

  return {
    title,
    description: descriptions.join(" "),
    categoryId,
    cards,
    depth: payload.depth,
    total_tokens: totalTokens,
    chunksProcessed: chunks.length,
  };
}

export function generatePodcastScriptUrl(): string {
  return aiFunctionUrl("generatePodcastScript");
}

export function generatePodcastAudioUrl(): string {
  return aiFunctionUrl("generatePodcastAudio");
}

export async function postGeneratePodcastScript(
  token: string,
  payload: {
    content: string;
    emotion: PodcastEmotion;
    mannerism: PodcastMannerism;
  }
): Promise<{
  title: string;
  script: string;
  categoryId: string;
  emotion: PodcastEmotion;
  mannerism: PodcastMannerism;
}> {
  const response = await fetch(generatePodcastScriptUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data: {
    error?: string;
    title?: string;
    script?: string;
    categoryId?: string;
    emotion?: string;
    mannerism?: string;
    manner?: string;
  } = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (response.status === 404) {
      throw new Error(
        "Podcast script generation is not running. Restart the Vite dev server, or use the deployed site."
      );
    }
    throw new Error(
      response.ok
        ? "Invalid response from podcast script generation."
        : `Podcast script failed (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(data.error || `Podcast script failed (${response.status}).`);
  }

  if (!data.script?.trim()) {
    throw new Error("Could not generate a podcast script. Try again.");
  }

  return {
    title: data.title || "Teaching podcast",
    script: data.script,
    categoryId: resolveStudyCategoryId({ categoryId: data.categoryId }),
    emotion: normalizePodcastEmotion(
      data.emotion ?? payload.emotion ?? DEFAULT_PODCAST_EMOTION
    ),
    mannerism: normalizePodcastMannerism(
      data.mannerism ??
        data.manner ??
        payload.mannerism ??
        DEFAULT_PODCAST_MANNERISM
    ),
  };
}

export async function postGeneratePodcastAudioChunk(
  token: string,
  payload: {
    text: string;
    emotion?: PodcastEmotion;
    mannerism?: PodcastMannerism;
  }
): Promise<ArrayBuffer> {
  const response = await fetch(generatePodcastAudioUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data: { error?: string; audioBase64?: string } = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (response.status === 404) {
      throw new Error(
        "Podcast audio generation is not running. Restart the Vite dev server, or use the deployed site."
      );
    }
    throw new Error(
      response.ok
        ? "Invalid response from podcast audio generation."
        : `Podcast audio failed (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(data.error || `Podcast audio failed (${response.status}).`);
  }

  if (!data.audioBase64) {
    throw new Error("Could not generate podcast audio. Try again.");
  }

  const binary = atob(data.audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function postGeneratePodcastAudio(
  token: string,
  script: string,
  onProgress?: (current: number, total: number) => void,
  style: {
    emotion?: PodcastEmotion;
    mannerism?: PodcastMannerism;
  } = {}
): Promise<Blob> {
  const chunks = chunkPodcastScript(script);
  if (!chunks.length) {
    throw new Error("Podcast script is empty.");
  }

  const emotion = normalizePodcastEmotion(
    style.emotion ?? DEFAULT_PODCAST_EMOTION
  );
  const mannerism = normalizePodcastMannerism(
    style.mannerism ?? DEFAULT_PODCAST_MANNERISM
  );

  const parts: ArrayBuffer[] = [];
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i + 1, chunks.length);
    parts.push(
      await postGeneratePodcastAudioChunk(token, {
        text: chunks[i],
        emotion,
        mannerism,
      })
    );
  }

  return new Blob(parts, { type: "audio/mpeg" });
}

export async function postGenerateResume(
  token: string,
  payload: GenerateResumePayload
): Promise<{ content: string; total_tokens?: number }> {
  const response = await fetch(generateResumeFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data: { error?: string; content?: string; total_tokens?: number } = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (response.status === 404) {
      throw new Error(
        "AI service is not running. Use “npm run dev” (Netlify Dev) locally, or use the deployed site."
      );
    }
    throw new Error(
      response.ok
        ? "Invalid response from AI service."
        : `AI request failed (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(data.error || `AI request failed (${response.status}).`);
  }

  return {
    content: data.content || "",
    total_tokens: data.total_tokens,
  };
}

function normalizeAtsResult(raw: unknown): AtsCheckResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const score = typeof r.score === "number" ? r.score : Number(r.score);
  if (Number.isNaN(score)) return null;
  const recommendations = Array.isArray(r.recommendations)
    ? r.recommendations
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const rec = item as Record<string, unknown>;
          const sev = rec.severity;
          let severity: AtsRecommendationSeverity = "medium";
          if (sev === "high" || sev === "medium" || sev === "low") {
            severity = sev;
          }
          const recommendation: AtsRecommendation = {
            category: String(rec.category ?? "general"),
            severity,
            issue: String(rec.issue ?? ""),
            fix: String(rec.fix ?? ""),
          };
          return recommendation;
        })
        .filter((rec) => rec.issue.trim())
    : [];
  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    atsReady: Boolean(r.atsReady),
    shouldEdit: Boolean(r.shouldEdit),
    overview: String(r.overview ?? ""),
    strengths: Array.isArray(r.strengths)
      ? r.strengths.map((s) => String(s)).filter(Boolean)
      : [],
    recommendations,
    ivyNotes: String(r.ivyNotes ?? ""),
  };
}

export async function postParseResume(
  token: string,
  payload: { text: string; templateId?: string }
): Promise<{ resume: ResumeData; total_tokens?: number }> {
  const response = await fetch(parseResumeFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data: {
    error?: string;
    resume?: ResumeData;
    total_tokens?: number;
  } = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (response.status === 404) {
      throw new Error(
        "Parse resume is not running. Use “npm run dev:netlify” locally, or use the deployed site."
      );
    }
    throw new Error(
      response.ok
        ? "Invalid response from parse resume."
        : `Parse resume failed (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(data.error || `Parse resume failed (${response.status}).`);
  }

  if (!data.resume || typeof data.resume !== "object") {
    throw new Error("Could not read parsed resume. Try again.");
  }

  return { resume: data.resume, total_tokens: data.total_tokens };
}

export async function postAtsCheck(
  token: string,
  payload: AtsCheckPayload
): Promise<{ result: AtsCheckResult; total_tokens?: number }> {
  const response = await fetch(atsCheckFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data: {
    error?: string;
    result?: unknown;
    total_tokens?: number;
  } = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (response.status === 404) {
      throw new Error(
        "ATS check is not running. Use “npm run dev:netlify” locally, or use the deployed site."
      );
    }
    throw new Error(
      response.ok
        ? "Invalid response from ATS check."
        : `ATS check failed (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(data.error || `ATS check failed (${response.status}).`);
  }

  const result = normalizeAtsResult(data.result);
  if (!result) {
    throw new Error("Could not read ATS check results. Try again.");
  }

  return { result, total_tokens: data.total_tokens };
}
