import type { ComponentType, SVGProps } from "react";
import {
  AcademicCapIcon,
  BeakerIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  CalculatorIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FilmIcon,
  GlobeAltIcon,
  HeartIcon,
  LanguageIcon,
  LightBulbIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  ScaleIcon,
  SparklesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import {
  STUDY_CATEGORIES,
  resolveStudyCategoryId,
} from "./studyCategories";

export type StudyCategoryIcon = ComponentType<SVGProps<SVGSVGElement>>;

const GROUP_ICONS: Record<string, StudyCategoryIcon> = {
  "stem-math-cs": CpuChipIcon,
  "stem-physical": BeakerIcon,
  "stem-life": SparklesIcon,
  "health-medicine": HeartIcon,
  business: CurrencyDollarIcon,
  "social-sciences": UserGroupIcon,
  humanities: BookOpenIcon,
  languages: LanguageIcon,
  "arts-design": PaintBrushIcon,
  "law-policy": ScaleIcon,
  "test-prep": AcademicCapIcon,
  "career-skills": BriefcaseIcon,
  general: LightBulbIcon,
};

const CATEGORY_ICONS: Record<string, StudyCategoryIcon> = {
  math: CalculatorIcon,
  statistics: ChartBarIcon,
  "computer-science": CpuChipIcon,
  "data-science": ChartBarIcon,
  engineering: WrenchScrewdriverIcon,
  physics: BeakerIcon,
  chemistry: BeakerIcon,
  astronomy: SparklesIcon,
  "earth-science": GlobeAltIcon,
  biology: SparklesIcon,
  anatomy: HeartIcon,
  microbiology: BeakerIcon,
  genetics: BeakerIcon,
  agriculture: SparklesIcon,
  nursing: HeartIcon,
  medicine: HeartIcon,
  pharmacy: BeakerIcon,
  "public-health": HeartIcon,
  dentistry: HeartIcon,
  "allied-health": HeartIcon,
  accounting: CurrencyDollarIcon,
  finance: CurrencyDollarIcon,
  marketing: ChatBubbleLeftRightIcon,
  management: BriefcaseIcon,
  economics: ChartBarIcon,
  entrepreneurship: LightBulbIcon,
  psychology: UserGroupIcon,
  sociology: UserGroupIcon,
  "political-science": BuildingLibraryIcon,
  anthropology: UserGroupIcon,
  geography: GlobeAltIcon,
  education: AcademicCapIcon,
  history: BookOpenIcon,
  philosophy: LightBulbIcon,
  religion: BuildingLibraryIcon,
  classics: BookOpenIcon,
  linguistics: LanguageIcon,
  english: DocumentTextIcon,
  spanish: LanguageIcon,
  french: LanguageIcon,
  german: LanguageIcon,
  mandarin: LanguageIcon,
  "other-language": LanguageIcon,
  "visual-arts": PaintBrushIcon,
  music: MusicalNoteIcon,
  theater: SparklesIcon,
  film: FilmIcon,
  architecture: BuildingLibraryIcon,
  "graphic-design": PaintBrushIcon,
  law: ScaleIcon,
  "criminal-justice": ScaleIcon,
  ethics: ScaleIcon,
  "government-civics": BuildingLibraryIcon,
  "sat-act": AcademicCapIcon,
  "gre-gmat": AcademicCapIcon,
  "mcat-lsat": AcademicCapIcon,
  "ap-ib": AcademicCapIcon,
  "professional-cert": AcademicCapIcon,
  "coding-interview": CodeBracketIcon,
  "clinical-skills": HeartIcon,
  "lab-techniques": BeakerIcon,
  "soft-skills": ChatBubbleLeftRightIcon,
  general: LightBulbIcon,
  other: BookOpenIcon,
};

const categoryGroupById = new Map(
  STUDY_CATEGORIES.map((category) => [category.id, category.groupId])
);

export function getStudyCategoryIcon(
  data: { categoryId?: string | null; category?: string | null } | string
): StudyCategoryIcon {
  const categoryId =
    typeof data === "string" ? data : resolveStudyCategoryId(data);

  const specific = CATEGORY_ICONS[categoryId];
  if (specific) return specific;

  const groupId = categoryGroupById.get(categoryId);
  if (groupId && GROUP_ICONS[groupId]) return GROUP_ICONS[groupId];

  return BookOpenIcon;
}
