import {
  brandLogo,
  type BrandLogoTone,
} from "../constants/brandLogo";
import type { StudyFlowAccent } from "../constants/studyFlowAccent";

type BrandLogoProps = {
  accent?: StudyFlowAccent | BrandLogoTone | "podcast";
  className?: string;
  alt?: string;
};

export default function BrandLogo({
  accent = "default",
  className = "h-8 w-auto",
  alt = "Brightfolio",
}: BrandLogoProps) {
  return (
    <img
      src={brandLogo(accent)}
      alt={alt}
      className={`object-contain object-center shrink-0 ${className}`}
    />
  );
}
