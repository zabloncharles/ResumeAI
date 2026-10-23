import type { StudyFlowAccent } from "./studyFlowAccent";

export const BRAND_LOGO = {
  teal: "/images/logo/owl_teal.png",
  purple: "/images/logo/owl_purple.png",
  burgundy: "/images/logo/owl_burgundy.png",
} as const;

export type BrandLogoTone = keyof typeof BRAND_LOGO;

export function brandLogo(
  accent: StudyFlowAccent | BrandLogoTone | "podcast" = "default"
): string {
  if (accent === "teal" || accent === "purple" || accent === "burgundy") {
    return BRAND_LOGO[accent];
  }
  if (accent === "violet" || accent === "podcast") {
    return BRAND_LOGO.purple;
  }
  if (accent === "rose") {
    return BRAND_LOGO.burgundy;
  }
  return BRAND_LOGO.teal;
}
