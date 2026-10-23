import BrandLogo from "./BrandLogo";
import {
  studyFlowAccent,
  type StudyFlowAccent,
} from "../constants/studyFlowAccent";
import type { BrandLogoTone } from "../constants/brandLogo";

type BrandMarkProps = {
  accent?: StudyFlowAccent | BrandLogoTone | "podcast";
  logoClassName?: string;
  nameClassName?: string;
  className?: string;
};

function resolveFlowAccent(
  accent: StudyFlowAccent | BrandLogoTone | "podcast"
): StudyFlowAccent {
  if (accent === "podcast" || accent === "purple") return "violet";
  if (accent === "burgundy") return "rose";
  if (accent === "teal") return "default";
  return accent;
}

export default function BrandMark({
  accent = "default",
  logoClassName = "h-8 w-auto",
  nameClassName = "text-xl",
  className = "",
}: BrandMarkProps) {
  const flow = studyFlowAccent(resolveFlowAccent(accent));

  return (
    <span
      className={`inline-flex items-center gap-2.5 min-w-0 shrink-0 ${className}`}
    >
      <BrandLogo accent={accent} className={logoClassName} alt="" />
      <span
        className={`font-bold ${flow.brandGradient} truncate ${nameClassName}`}
      >
        Brightfolio
      </span>
    </span>
  );
}
