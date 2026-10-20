const VALID_IDS = new Set([
  "harvard-mcs",
  "harvard-industry",
  "princeton-standard",
  "princeton-cals",
  "yale-standard",
  "yale-with-summary",
  "yale-technical",
  "brown-standard",
  "cornell-standard",
  "modern",
  "executive",
  "minimal",
  "creative",
  "classic",
]);

function normalizeTemplateId(value) {
  if (value === "classic") return "harvard-mcs";
  if (typeof value === "string" && VALID_IDS.has(value)) return value;
  return "harvard-mcs";
}

function ivyFamilyFromTemplate(templateId) {
  const id = normalizeTemplateId(templateId);
  if (id.startsWith("princeton")) return "princeton";
  if (id.startsWith("yale")) return "yale";
  if (id.startsWith("brown")) return "brown";
  if (id.startsWith("cornell")) return "cornell";
  return "harvard";
}

function harvardVariantRules(templateId) {
  const id = normalizeTemplateId(templateId);
  if (id === "harvard-industry") {
    return [
      "Section order on the resume is experience before education (industry-focused).",
      "Bullets should stress business outcomes, scope, and leadership where relevant.",
    ].join(" ");
  }
  return [
    "Section order on the resume is education before experience (MCS undergraduate style).",
    "Professional summary is optional and usually omitted for students; if suggested, keep it to 2–3 factual sentences.",
  ].join(" ");
}

function princetonVariantRules(templateId) {
  const id = normalizeTemplateId(templateId);
  if (id === "princeton-cals") {
    return "Emphasize research, technical skills, and education alongside work experience (STEM-friendly Princeton guidance).";
  }
  return "Follow Princeton Center for Career Development one-page resume conventions.";
}

function yaleVariantRules(templateId) {
  const id = normalizeTemplateId(templateId);
  if (id === "yale-with-summary") {
    return "Summary appears after the header (3–5 lines). Then education, work experience, and skills. Use present simple tense for current roles and past tense for prior roles.";
  }
  if (id === "yale-technical") {
    return "Order: optional summary, education, technical skills (listed concretely), then work experience. Use accomplishment-style bullets (what, how, outcome); 3–5 bullets per role when possible.";
  }
  return "Yale OCS Resume 1 style: education before experience; summary optional at end if included.";
}

function brownVariantRules() {
  return "Brown CareerLAB: chronological one-page resume. Do not include a summary or objective for early-career candidates (under ~5 years experience). Education before professional experience.";
}

function cornellVariantRules() {
  return "Cornell Career Services: single-column ATS resume, education forward, 2–4 bullets per role, measurable skills; optional objective only for career changers.";
}

function schoolLabelForFamily(family) {
  if (family === "princeton") return "Princeton University Center for Career Development";
  if (family === "yale") return "Yale Office of Career Strategy (OCS)";
  if (family === "brown") return "Brown University CareerLAB";
  if (family === "cornell") return "Cornell Career Services";
  return "Harvard Mignone Center for Careers (MCS)";
}

function ivyStandardsBlock(templateId) {
  const family = ivyFamilyFromTemplate(templateId);
  const shared = [
    "Use one page, 10–12 pt equivalent density, simple ATS-safe language.",
    "Do not use first person (no I/me/my). Avoid clichés and vague soft skills without evidence.",
    "Experience bullets start with strong action verbs; quantify results when plausible without inventing numbers.",
    "Each bullet is about one to two lines.",
  ].join(" ");

  if (family === "princeton") {
    return [
      "You write resume content aligned with Princeton University Center for Career Development recommendations.",
      princetonVariantRules(templateId),
      shared,
      "Skills should be concrete and measurable (tools, languages, methods).",
    ].join(" ");
  }
  if (family === "yale") {
    return [
      "You write resume content aligned with Yale OCS resume templates and formatting guidance.",
      yaleVariantRules(templateId),
      shared,
      "Limit each role to about 3–4 bullets where possible.",
    ].join(" ");
  }
  if (family === "brown") {
    return [
      "You write resume content aligned with Brown University CareerLAB fundamentals.",
      brownVariantRules(),
      shared,
      "Use section heading Professional Experience for work history.",
    ].join(" ");
  }
  if (family === "cornell") {
    return [
      "You write resume content aligned with Cornell Career Services resume guidance.",
      cornellVariantRules(),
      shared,
      "Skills should list software, languages, and technical procedures with proficiency when relevant.",
    ].join(" ");
  }

  return [
    "You write resume content aligned with Harvard Mignone Center for Careers (MCS) recommendations.",
    harvardVariantRules(templateId),
    shared,
    "List skills as plain, specific capabilities; show communication and teamwork through bullets, not skill lists.",
  ].join(" ");
}

function buildIvyAiSystemMessage(templateId) {
  const family = ivyFamilyFromTemplate(templateId);
  return [
    `You are an expert resume writer following ${schoolLabelForFamily(family)} standards.`,
    ivyStandardsBlock(templateId),
    "Return exactly 5 items, each on its own line, each line starting with '- ' (hyphen and space). No intro text, no numbering.",
  ].join(" ");
}

function buildIvySectionPrompt(templateId, section, profession) {
  const role = (profession || "").trim();
  if (!role) return "";

  const standards = ivyStandardsBlock(templateId);
  const family = ivyFamilyFromTemplate(templateId);
  const id = normalizeTemplateId(templateId);

  if (section === "profile") {
    if (family === "brown") {
      return [
        `Generate 5 one-line professional headlines for a ${role} candidate (target role positioning, not a summary paragraph).`,
        standards,
        "Brown early-career resumes omit summary sections; these lines can refine the title/headline under the name.",
        "Return as bullet points.",
      ].join(" ");
    }
    if (
      family === "yale" &&
      (id === "yale-with-summary" || id === "yale-technical")
    ) {
      return [
        `Generate 5 resume summary blocks for a ${role} candidate (3–5 lines each).`,
        standards,
        "Summaries appear near the top of the resume. No first person. Highlight fit for the target role.",
        "Return as bullet points.",
      ].join(" ");
    }
    if (family === "harvard" && id === "harvard-mcs") {
      return [
        `Generate 5 optional professional summary blocks for a ${role} candidate.`,
        standards,
        "Each item should be 2–3 sentences max, factual, with no first person.",
        "Summaries should be safe to place last on the resume or omit entirely (common for MCS undergraduates).",
        "Return as bullet points.",
      ].join(" ");
    }
    return [
      `Generate 5 professional summary statements tailored for a ${role}.`,
      standards,
      "Each summary should be 2–3 sentences, concise, and role-specific.",
      "Return as bullet points.",
    ].join(" ");
  }

  if (section === "employment" || section === "experience") {
    return [
      `Generate 5 resume bullet points for the role: ${role}.`,
      standards,
      "Each bullet is a single achievement or responsibility with impact; use past tense for past work.",
      "Return as bullet points.",
    ].join(" ");
  }

  return "";
}

function buildParseResumeSystemMessage(templateId) {
  return [
    "You are an Ivy-style resume import assistant. Map pasted resume text into a strict JSON resume model.",
    ivyStandardsBlock(templateId),
    "Include ONLY: contact info, optional brief profile, paid work and internships, and formal education.",
    "DROP entirely: athletics, sports teams, hobbies, clubs, volunteer-only sections, leadership and activities, skills lists, certifications, awards, references, and any section that is not employment or degree-granting education.",
    "Employment is highest priority: every job or internship must have title, company, startDate, and endDate when present in the source. Infer nothing for dates; use empty string if missing.",
    "For each job, rewrite up to four strong bullets (action + result). Never more than four bullets per job. Prefer the most recent and relevant roles if the source is long.",
    "Education: school name, degree, and graduation year in endDate when available.",
    "personalInfo.photo must always be an empty string.",
    "Return only one JSON object matching the schema. No markdown fences or commentary.",
  ].join(" ");
}

function buildParseResumeUserPrompt(schema, text, templateId) {
  return [
    `Target template context: ${ivyAiGuidanceLabel(templateId)}.`,
    "Parse the resume text into the schema below.",
    "Reorganize misplaced content into the correct fields. Do not invent employers, degrees, or dates.",
    "If the source mixes jobs and activities, keep only real work/internship entries.",
    `Schema:\n${schema}`,
    "Resume text:",
    text,
  ].join("\n\n");
}

function ivyAiGuidanceLabel(templateId) {
  const family = ivyFamilyFromTemplate(templateId);
  const id = normalizeTemplateId(templateId);
  if (family === "princeton") {
    return id === "princeton-cals"
      ? "Princeton (STEM emphasis)"
      : "Princeton CCD";
  }
  if (family === "yale") {
    if (id === "yale-with-summary") return "Yale OCS (summary first)";
    if (id === "yale-technical") return "Yale OCS (technical)";
    return "Yale OCS";
  }
  if (family === "brown") return "Brown CareerLAB";
  if (family === "cornell") return "Cornell Career Services";
  return id === "harvard-industry"
    ? "Harvard MCS (experience first)"
    : "Harvard MCS";
}

export {
  normalizeTemplateId,
  ivyStandardsBlock,
  ivyAiGuidanceLabel,
  buildIvyAiSystemMessage,
  buildIvySectionPrompt,
  buildParseResumeSystemMessage,
  buildParseResumeUserPrompt,
};
