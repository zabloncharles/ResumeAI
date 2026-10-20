export const IVY_LEAGUE_IDS = [
  "harvard",
  "princeton",
  "yale",
  "brown",
  "cornell",
] as const;

export type IvyLeagueId = (typeof IVY_LEAGUE_IDS)[number];

export const ivyLeagueOptions: {
  id: IvyLeagueId;
  label: string;
}[] = [
  { id: "harvard", label: "Harvard (MCS)" },
  { id: "princeton", label: "Princeton" },
  { id: "yale", label: "Yale (OCS)" },
  { id: "brown", label: "Brown (CareerLAB)" },
  { id: "cornell", label: "Cornell" },
];

export const RESUME_TEMPLATE_IDS = [
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
] as const;

export type IvyPdfLayoutKind =
  | "harvard-mcs"
  | "harvard-industry"
  | "princeton"
  | "yale-summary-first"
  | "yale-technical"
  | "brown-no-summary";

export function ivyPdfLayoutKind(templateId: string): IvyPdfLayoutKind {
  const id = normalizeTemplateId(templateId);
  switch (id) {
    case "harvard-industry":
      return "harvard-industry";
    case "princeton-standard":
    case "princeton-cals":
      return "princeton";
    case "yale-with-summary":
      return "yale-summary-first";
    case "yale-technical":
      return "yale-technical";
    case "brown-standard":
      return "brown-no-summary";
    case "yale-standard":
    case "cornell-standard":
    case "harvard-mcs":
    default:
      return "harvard-mcs";
  }
}

export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];

export type ResumeTemplateMeta = {
  id: ResumeTemplateId;
  name: string;
  description: string;
  thumbnail: string;
  ivy: IvyLeagueId;
};

export function isResumeTemplateId(value: string): value is ResumeTemplateId {
  return (RESUME_TEMPLATE_IDS as readonly string[]).includes(value);
}

export function normalizeTemplateId(value: string): ResumeTemplateId {
  if (value === "classic") return "harvard-mcs";
  if (isResumeTemplateId(value)) return value;
  return "harvard-mcs";
}

export function ivyForTemplate(templateId: string): IvyLeagueId {
  const id = normalizeTemplateId(templateId);
  const match = resumeTemplates.find((t) => t.id === id);
  return match?.ivy ?? "harvard";
}

export const RESUME_TEMPLATE_STORAGE_KEY = "resumeSelectedTemplate";
export const RESUME_LOCAL_EDIT_AT_KEY = "resumeLocalEditAt";

export const resumeTemplates: ResumeTemplateMeta[] = [
  {
    id: "harvard-mcs",
    ivy: "harvard",
    name: "MCS Bullet Point",
    description:
      "Mignone Center standard: education-forward, plain skills, ATS-safe",
    thumbnail: "/svg/Businessprofessional.png",
  },
  {
    id: "harvard-industry",
    ivy: "harvard",
    name: "Experience First",
    description:
      "Same MCS styling with work experience before education for industry roles",
    thumbnail: "/svg/Executive.png",
  },
  {
    id: "princeton-standard",
    ivy: "princeton",
    name: "Resume Guide",
    description:
      "Center for Career Development layout with role header lines and bullet skills",
    thumbnail: "/svg/minimal.png",
  },
  {
    id: "princeton-cals",
    ivy: "princeton",
    name: "STEM emphasis",
    description:
      "Same Princeton layout with education and research sections emphasized",
    thumbnail: "/svg/Businessprofessional.png",
  },
  {
    id: "yale-standard",
    ivy: "yale",
    name: "OCS Resume 1",
    description:
      "Yale OCS ATS template: education first, classic experience blocks (same layout as MCS)",
    thumbnail: "/svg/Businessprofessional.png",
  },
  {
    id: "yale-with-summary",
    ivy: "yale",
    name: "OCS With Summary",
    description:
      "Yale Resume 2: 3–5 line summary after header, then education and experience",
    thumbnail: "/svg/Executive.png",
  },
  {
    id: "yale-technical",
    ivy: "yale",
    name: "OCS Technical",
    description:
      "STEM order: summary, education, technical skills, then work experience",
    thumbnail: "/svg/minimal.png",
  },
  {
    id: "brown-standard",
    ivy: "brown",
    name: "CareerLAB Standard",
    description:
      "Brown chronological resume: no summary for early-career; education then experience",
    thumbnail: "/svg/Businessprofessional.png",
  },
  {
    id: "cornell-standard",
    ivy: "cornell",
    name: "Career Network",
    description:
      "Cornell single-column ATS resume: education forward (same layout as MCS)",
    thumbnail: "/svg/minimal.png",
  },
];

export function templatesForIvy(ivy: IvyLeagueId): ResumeTemplateMeta[] {
  return resumeTemplates.filter((t) => t.ivy === ivy);
}

export function isIvyChooserTemplate(templateId: string): boolean {
  const id = normalizeTemplateId(templateId);
  return resumeTemplates.some((t) => t.id === id);
}

export function templateDisplayName(templateId?: string): string {
  const id = normalizeTemplateId(templateId ?? "harvard-mcs");
  const match = resumeTemplates.find((t) => t.id === id);
  if (match) return match.name;
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
