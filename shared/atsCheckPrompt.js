import {
  ivyAiGuidanceLabel,
  ivyStandardsBlock,
  normalizeTemplateId,
} from "./ivyAiGuidelines.js";

const ATS_JSON_SCHEMA = `{
  "score": number (0-100, ATS + Ivy alignment combined),
  "atsReady": boolean (true if likely to parse cleanly in typical ATS),
  "shouldEdit": boolean (true if meaningful edits are recommended before applying),
  "overview": string (2-3 sentences),
  "strengths": string[] (3-5 items),
  "recommendations": [
    {
      "category": string (e.g. "formatting", "experience", "summary", "skills", "contact", "ivy-template"),
      "severity": "high" | "medium" | "low",
      "issue": string,
      "fix": string (specific edit suggestion)
    }
  ],
  "ivyNotes": string (how well content matches the selected Ivy template conventions)
}`;

export function buildAtsCheckSystemMessage(templateId) {
  const id = normalizeTemplateId(templateId);
  const label = ivyAiGuidanceLabel(id);
  return [
    `You are an ATS (applicant tracking system) analyst and Ivy League career center advisor.`,
    `Evaluate the resume against ATS parsing best practices AND ${label} guidelines.`,
    ivyStandardsBlock(id),
    "Check: contact info, section clarity, action verbs, quantification, keyword density, forbidden formatting (tables, columns, graphics), summary placement vs template, skills presentation, date consistency, bullet length.",
    "Be honest but constructive. Do not invent experience the candidate did not provide.",
    `Respond with a single JSON object matching this schema exactly (no markdown, no extra keys): ${ATS_JSON_SCHEMA}`,
  ].join(" ");
}

export function buildAtsCheckUserMessage(body, templateId, templateName) {
  const id = normalizeTemplateId(templateId);
  const resumePayload =
    body && typeof body === "object" && body.resume ? body.resume : body;
  const exportContext =
    body && typeof body === "object" && body.exportContext
      ? body.exportContext
      : null;

  return [
    `Selected template: ${templateName || id} (${ivyAiGuidanceLabel(id)}).`,
    exportContext
      ? `Exported Ivy PDF context (do not recommend fixes already handled in export): ${JSON.stringify(exportContext)}`
      : "Exported Ivy PDFs omit photos and use uppercase section headings (Education, Experience, Skills, etc.).",
    "Do not recommend adding section headings if exportContext.ivyPdfIncludesSectionHeadings is true.",
    "Do not flag profile photo if exportContext.ivyPdfIncludesPhoto is false and photo was stripped from payload.",
    "If exportContext.atsPayloadOmitsFullNameAndPhone is true, full name and phone were withheld for privacy—do not recommend adding them and do not penalize their absence.",
    "Evaluate content and stored fields only.",
    "Resume data (JSON):",
    JSON.stringify(resumePayload, null, 2),
    "Score ATS readiness and Ivy template fit. List prioritized fixes.",
  ].join("\n\n");
}
