export type StudyCategoryGroup = {
  id: string;
  label: string;
};

export type StudyCategory = {
  id: string;
  groupId: string;
  label: string;
};

export const STUDY_CATEGORY_GROUPS: StudyCategoryGroup[] = [
  { id: "stem-math-cs", label: "STEM — Math & computing" },
  { id: "stem-physical", label: "STEM — Physical sciences" },
  { id: "stem-life", label: "STEM — Life sciences" },
  { id: "health-medicine", label: "Health & medicine" },
  { id: "business", label: "Business & economics" },
  { id: "social-sciences", label: "Social sciences" },
  { id: "humanities", label: "Humanities" },
  { id: "languages", label: "Languages" },
  { id: "arts-design", label: "Arts & design" },
  { id: "law-policy", label: "Law & policy" },
  { id: "test-prep", label: "Test & admissions prep" },
  { id: "career-skills", label: "Career & skills" },
  { id: "general", label: "General" },
];

export const STUDY_CATEGORIES: StudyCategory[] = [
  { id: "math", groupId: "stem-math-cs", label: "Mathematics" },
  { id: "statistics", groupId: "stem-math-cs", label: "Statistics" },
  { id: "computer-science", groupId: "stem-math-cs", label: "Computer science" },
  { id: "data-science", groupId: "stem-math-cs", label: "Data science" },
  { id: "engineering", groupId: "stem-math-cs", label: "Engineering (general)" },

  { id: "physics", groupId: "stem-physical", label: "Physics" },
  { id: "chemistry", groupId: "stem-physical", label: "Chemistry" },
  { id: "astronomy", groupId: "stem-physical", label: "Astronomy" },
  { id: "earth-science", groupId: "stem-physical", label: "Earth & environmental science" },

  { id: "biology", groupId: "stem-life", label: "Biology" },
  { id: "anatomy", groupId: "stem-life", label: "Anatomy & physiology" },
  { id: "microbiology", groupId: "stem-life", label: "Microbiology" },
  { id: "genetics", groupId: "stem-life", label: "Genetics" },
  { id: "agriculture", groupId: "stem-life", label: "Agriculture & nutrition" },

  { id: "nursing", groupId: "health-medicine", label: "Nursing" },
  { id: "medicine", groupId: "health-medicine", label: "Medicine" },
  { id: "pharmacy", groupId: "health-medicine", label: "Pharmacy" },
  { id: "public-health", groupId: "health-medicine", label: "Public health" },
  { id: "dentistry", groupId: "health-medicine", label: "Dentistry" },
  { id: "allied-health", groupId: "health-medicine", label: "Allied health" },

  { id: "accounting", groupId: "business", label: "Accounting" },
  { id: "finance", groupId: "business", label: "Finance" },
  { id: "marketing", groupId: "business", label: "Marketing" },
  { id: "management", groupId: "business", label: "Management" },
  { id: "economics", groupId: "business", label: "Economics" },
  { id: "entrepreneurship", groupId: "business", label: "Entrepreneurship" },

  { id: "psychology", groupId: "social-sciences", label: "Psychology" },
  { id: "sociology", groupId: "social-sciences", label: "Sociology" },
  { id: "political-science", groupId: "social-sciences", label: "Political science" },
  { id: "anthropology", groupId: "social-sciences", label: "Anthropology" },
  { id: "geography", groupId: "social-sciences", label: "Geography" },
  { id: "education", groupId: "social-sciences", label: "Education" },

  { id: "history", groupId: "humanities", label: "History" },
  { id: "philosophy", groupId: "humanities", label: "Philosophy" },
  { id: "religion", groupId: "humanities", label: "Religion & theology" },
  { id: "classics", groupId: "humanities", label: "Classics" },
  { id: "linguistics", groupId: "humanities", label: "Linguistics" },

  { id: "english", groupId: "languages", label: "English & literature" },
  { id: "spanish", groupId: "languages", label: "Spanish" },
  { id: "french", groupId: "languages", label: "French" },
  { id: "german", groupId: "languages", label: "German" },
  { id: "mandarin", groupId: "languages", label: "Mandarin Chinese" },
  { id: "other-language", groupId: "languages", label: "Other language" },

  { id: "visual-arts", groupId: "arts-design", label: "Visual arts" },
  { id: "music", groupId: "arts-design", label: "Music" },
  { id: "theater", groupId: "arts-design", label: "Theater & dance" },
  { id: "film", groupId: "arts-design", label: "Film & media" },
  { id: "architecture", groupId: "arts-design", label: "Architecture" },
  { id: "graphic-design", groupId: "arts-design", label: "Graphic design" },

  { id: "law", groupId: "law-policy", label: "Law" },
  { id: "criminal-justice", groupId: "law-policy", label: "Criminal justice" },
  { id: "ethics", groupId: "law-policy", label: "Ethics" },
  { id: "government-civics", groupId: "law-policy", label: "Government & civics" },

  { id: "sat-act", groupId: "test-prep", label: "SAT / ACT" },
  { id: "gre-gmat", groupId: "test-prep", label: "GRE / GMAT" },
  { id: "mcat-lsat", groupId: "test-prep", label: "MCAT / LSAT / professional exams" },
  { id: "ap-ib", groupId: "test-prep", label: "AP / IB" },
  { id: "professional-cert", groupId: "test-prep", label: "Professional certification" },

  { id: "coding-interview", groupId: "career-skills", label: "Coding interviews" },
  { id: "clinical-skills", groupId: "career-skills", label: "Clinical skills" },
  { id: "lab-techniques", groupId: "career-skills", label: "Lab techniques" },
  { id: "soft-skills", groupId: "career-skills", label: "Communication & soft skills" },

  { id: "general", groupId: "general", label: "General" },
  { id: "other", groupId: "general", label: "Other" },
];

const categoryById = new Map(STUDY_CATEGORIES.map((c) => [c.id, c]));

export const DEFAULT_STUDY_CATEGORY_ID = "general";

export function isStudyCategoryId(id: string): boolean {
  return categoryById.has(id);
}

export function getStudyCategoryLabel(categoryId: string): string {
  return categoryById.get(categoryId)?.label ?? categoryId;
}

export function resolveStudyCategoryId(data: {
  categoryId?: string | null;
  category?: string | null;
}): string {
  const id = data.categoryId?.trim();
  if (id && isStudyCategoryId(id)) return id;

  const legacy = data.category?.trim();
  if (!legacy) return DEFAULT_STUDY_CATEGORY_ID;

  const lower = legacy.toLowerCase();
  const byId = categoryById.get(lower);
  if (byId) return byId.id;

  const byLabel = STUDY_CATEGORIES.find(
    (c) => c.label.toLowerCase() === lower
  );
  if (byLabel) return byLabel.id;

  return "other";
}

export function studyCategoryFirestoreFields(categoryId: string): {
  categoryId: string;
  category: string;
} {
  const id = isStudyCategoryId(categoryId)
    ? categoryId
    : DEFAULT_STUDY_CATEGORY_ID;
  return {
    categoryId: id,
    category: getStudyCategoryLabel(id),
  };
}

export function studyCategorySearchText(data: {
  categoryId?: string | null;
  category?: string | null;
}): string {
  const id = resolveStudyCategoryId(data);
  const label = getStudyCategoryLabel(id);
  const legacy = data.category?.trim() ?? "";
  return [id, label, legacy].filter(Boolean).join(" ").toLowerCase();
}

export function displayStudySetCategory(data: {
  categoryId?: string | null;
  category?: string | null;
}): string {
  const id = data.categoryId?.trim();
  if (id && isStudyCategoryId(id)) {
    return getStudyCategoryLabel(id);
  }
  const legacy = data.category?.trim();
  if (legacy) return legacy;
  return getStudyCategoryLabel(resolveStudyCategoryId(data));
}
