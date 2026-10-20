const MAX_BULLETS_PER_JOB = 4;
const MAX_EXPERIENCE_ENTRIES = 12;
const MAX_EDUCATION_ENTRIES = 6;
const MAX_WEBSITES = 5;

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeYearOrMonth(value, yearOnlyPreferred = false) {
  const raw = asString(value);
  if (!raw) return "";

  const present = /present|current|now/i.test(raw);
  if (present) return "";

  const isoMonth = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMonth) {
    const month = String(isoMonth[2]).padStart(2, "0");
    return `${isoMonth[1]}-${month}`;
  }

  const slash = raw.match(/^(\d{1,2})[/.-](\d{4})$/);
  if (slash) {
    if (yearOnlyPreferred) return slash[2];
    const month = String(slash[1]).padStart(2, "0");
    return `${slash[2]}-${month}`;
  }

  const yearMonth = raw.match(/^(\d{4})[/.-](\d{1,2})$/);
  if (yearMonth) {
    if (yearOnlyPreferred) return yearMonth[1];
    const month = String(yearMonth[2]).padStart(2, "0");
    return `${yearMonth[1]}-${month}`;
  }

  const year = raw.match(/\b(19|20)\d{2}\b/);
  if (year) return year[0];

  return raw;
}

function normalizeBullets(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const item of list) {
    const text = asString(item);
    if (!text) continue;
    out.push(text);
    if (out.length >= MAX_BULLETS_PER_JOB) break;
  }
  return out;
}

function normalizeExperience(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const title = asString(entry.title);
    const company = asString(entry.company);
    if (!title && !company) continue;

    out.push({
      title: title || "Role",
      company: company || "Organization",
      startDate: normalizeYearOrMonth(entry.startDate, false),
      endDate: normalizeYearOrMonth(entry.endDate, false),
      description: normalizeBullets(entry.description),
    });
    if (out.length >= MAX_EXPERIENCE_ENTRIES) break;
  }
  return out;
}

function normalizeEducation(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const school = asString(entry.school);
    const degree = asString(entry.degree);
    if (!school && !degree) continue;

    const endDate = normalizeYearOrMonth(entry.endDate, true);
    const startDate = normalizeYearOrMonth(entry.startDate, true);

    out.push({
      school: school || "School",
      degree: degree || "Degree",
      startDate,
      endDate: endDate || startDate,
    });
    if (out.length >= MAX_EDUCATION_ENTRIES) break;
  }
  return out;
}

function normalizeWebsites(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const url = asString(entry.url);
    if (!url || !/^https?:\/\//i.test(url)) continue;
    const label = asString(entry.label) || "Link";
    out.push({ label, url });
    if (out.length >= MAX_WEBSITES) break;
  }
  return out;
}

export function normalizeParsedResume(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const personal =
    source.personalInfo && typeof source.personalInfo === "object"
      ? source.personalInfo
      : {};

  return {
    personalInfo: {
      fullName: asString(personal.fullName),
      title: asString(personal.title),
      email: asString(personal.email),
      phone: asString(personal.phone),
      location: asString(personal.location),
      photo: "",
    },
    profile: asString(source.profile),
    experience: normalizeExperience(source.experience),
    education: normalizeEducation(source.education),
    websites: normalizeWebsites(source.websites),
  };
}

export function resumeDataJsonSchemaDescription() {
  return `{
  "personalInfo": {
    "fullName": "string",
    "title": "string (target or current professional headline)",
    "email": "string",
    "phone": "string",
    "location": "string (city, state or similar)",
    "photo": ""
  },
  "profile": "string (optional professional summary; empty string if none)",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "startDate": "YYYY-MM or YYYY when month unknown",
      "endDate": "YYYY-MM, YYYY, or empty string for current role",
      "description": ["string (max 4 bullets per job)"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "school": "string",
      "startDate": "YYYY if known, else empty",
      "endDate": "graduation year YYYY if known, else empty"
    }
  ],
  "websites": [{ "label": "string", "url": "string https URL" }]
}`;
}
