import type { ResumeData } from "../types/ResumeData";
import {
  ivyPdfLayoutKind,
  normalizeTemplateId,
  type ResumeTemplateId,
} from "../constants/resumeTemplates";

export function templateDiscouragesSummary(templateId: string): boolean {
  const id = normalizeTemplateId(templateId);
  if (id === "brown-standard") return true;
  if (id === "harvard-mcs" || id === "yale-standard" || id === "cornell-standard") {
    return true;
  }
  return false;
}

export function templateUsesSummaryFirst(templateId: string): boolean {
  const kind = ivyPdfLayoutKind(normalizeTemplateId(templateId));
  return kind === "yale-summary-first" || kind === "yale-technical";
}

export function buildAtsResumePayload(
  resumeData: ResumeData,
  templateId: ResumeTemplateId
) {
  const {
    photo: _photo,
    fullName: _fullName,
    phone: _phone,
    ...personalForAts
  } = resumeData.personalInfo;
  return {
    resume: {
      ...resumeData,
      personalInfo: {
        ...personalForAts,
        fullName: "",
        phone: "",
        photo: "",
      },
    },
    exportContext: {
      ivyPdfIncludesPhoto: false,
      atsPayloadOmitsFullNameAndPhone: true,
      ivyPdfIncludesSectionHeadings: true,
      storedDatesFormat: "YYYY-MM or YYYY in editor; PDF shows Month YYYY",
      summaryOnPdf:
        templateDiscouragesSummary(templateId) && !templateUsesSummaryFirst(templateId)
          ? "Only if profile text is filled; MCS-style templates discourage summaries for students"
          : templateUsesSummaryFirst(templateId)
            ? "Summary section appears after header when profile is filled"
            : "Optional summary when profile is filled",
      templateId: normalizeTemplateId(templateId),
    },
  };
}

function normalizeBullet(text: string) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

export function findDuplicateExperienceBullets(resumeData: ResumeData): number {
  const seen = new Set<string>();
  let dupes = 0;
  for (const job of resumeData.experience) {
    for (const bullet of job.description) {
      const key = normalizeBullet(bullet);
      if (!key) continue;
      if (seen.has(key)) dupes += 1;
      else seen.add(key);
    }
  }
  return dupes;
}

export function dedupeExperienceBullets(resumeData: ResumeData): ResumeData {
  return {
    ...resumeData,
    experience: resumeData.experience.map((job) => {
      const seen = new Set<string>();
      const description: string[] = [];
      for (const bullet of job.description) {
        const key = normalizeBullet(bullet);
        if (!key) {
          description.push(bullet);
          continue;
        }
        if (seen.has(key)) continue;
        seen.add(key);
        description.push(bullet);
      }
      return { ...job, description };
    }),
  };
}

export function clearProfile(resumeData: ResumeData): ResumeData {
  return { ...resumeData, profile: "" };
}

export function clearPhoto(resumeData: ResumeData): ResumeData {
  return {
    ...resumeData,
    personalInfo: { ...resumeData.personalInfo, photo: "" },
  };
}

const DATE_STORED = /^\d{4}(-\d{2})?$/;

export function findInconsistentStoredDates(resumeData: ResumeData): string[] {
  const issues: string[] = [];
  const check = (label: string, value: string) => {
    const t = value.trim();
    if (!t) return;
    if (!DATE_STORED.test(t)) {
      issues.push(`${label}: "${t}" (use YYYY or YYYY-MM)`);
    }
  };
  for (const [i, job] of resumeData.experience.entries()) {
    check(`Experience ${i + 1} start`, job.startDate);
    check(`Experience ${i + 1} end`, job.endDate);
  }
  for (const [i, edu] of resumeData.education.entries()) {
    check(`Education ${i + 1} start`, edu.startDate);
    check(`Education ${i + 1} end`, edu.endDate);
  }
  return issues;
}
