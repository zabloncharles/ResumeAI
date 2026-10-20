import type { ResumeData } from "../types/ResumeData";
import type {
  AtsCheckResult,
  AtsRecommendation,
  AtsRecommendationSeverity,
} from "../types/atsCheck";

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
