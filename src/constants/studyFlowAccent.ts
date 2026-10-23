export type StudyFlowAccent =
  | "default"
  | "sky"
  | "rose"
  | "violet"
  | "indigo";

const BRAND_START =
  "bg-gradient-to-r from-[#16aeac] bg-clip-text text-transparent";
const BRAND_START_MODE =
  "bg-gradient-to-r from-[#16aeac] dark:from-[#fdffff] bg-clip-text text-transparent";

export type StudyFlowAccentClasses = {
  brandGradient: string;
  plus: string;
  searchRing: string;
  btn: string;
  spinner: string;
  progress: string;
  focusField: string;
  selectedCard: string;
  text: string;
  textMuted: string;
  ring: string;
  playActive: string;
  playIdle: string;
  eqBar: string;
};

const skyChrome = {
  plus: "text-sky-600 dark:text-sky-400 focus:ring-sky-500",
  searchRing: "focus:ring-sky-500",
  btn: "bg-sky-600 text-white rounded-study hover:bg-sky-700 transition-colors",
  spinner: "border-sky-600",
  progress: "bg-sky-600",
  focusField: "focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30",
  selectedCard: "border-sky-500 bg-sky-500/5 dark:bg-sky-500/10",
  text: "text-sky-600 dark:text-sky-400",
  textMuted: "text-sky-600/80 dark:text-sky-400/80",
  ring: "focus-visible:ring-sky-500",
  playActive: "border-sky-500 bg-sky-600 text-white",
  playIdle:
    "border-white/15 bg-white/10 text-white group-hover:border-sky-400/60 group-hover:bg-sky-500/15",
  eqBar: "bg-sky-500",
} as const;

export const STUDY_FLOW_ACCENTS: Record<
  StudyFlowAccent,
  StudyFlowAccentClasses
> = {
  default: {
    brandGradient: `${BRAND_START} to-black dark:to-white`,
    ...skyChrome,
  },
  sky: {
    brandGradient: `${BRAND_START_MODE} to-sky-600 dark:to-sky-400`,
    ...skyChrome,
  },
  rose: {
    brandGradient: `${BRAND_START_MODE} to-rose-600 dark:to-rose-400`,
    plus: "text-rose-600 dark:text-rose-400 focus:ring-rose-500",
    searchRing: "focus:ring-rose-500",
    btn: "bg-rose-600 text-white rounded-study hover:bg-rose-700 transition-colors",
    spinner: "border-rose-600",
    progress: "bg-rose-600",
    focusField:
      "focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30",
    selectedCard: "border-rose-500 bg-rose-500/5 dark:bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    textMuted: "text-rose-600/80 dark:text-rose-400/80",
    ring: "focus-visible:ring-rose-500",
    playActive: "border-rose-500 bg-rose-600 text-white",
    playIdle:
      "border-white/15 bg-white/10 text-white group-hover:border-rose-400/60 group-hover:bg-rose-500/15",
    eqBar: "bg-rose-500",
  },
  violet: {
    brandGradient: `${BRAND_START_MODE} to-violet-600 dark:to-violet-400`,
    plus: "text-violet-600 dark:text-violet-400 focus:ring-violet-500",
    searchRing: "focus:ring-violet-500",
    btn: "bg-violet-600 text-white rounded-study hover:bg-violet-700 transition-colors",
    spinner: "border-violet-600",
    progress: "bg-violet-600",
    focusField:
      "focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30",
    selectedCard: "border-violet-500 bg-violet-500/5 dark:bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    textMuted: "text-violet-600/80 dark:text-violet-400/80",
    ring: "focus-visible:ring-violet-500",
    playActive: "border-violet-500 bg-violet-600 text-white",
    playIdle:
      "border-white/15 bg-white/10 text-white group-hover:border-violet-400/60 group-hover:bg-violet-500/15",
    eqBar: "bg-violet-500",
  },
  indigo: {
    brandGradient: `${BRAND_START_MODE} to-indigo-600 dark:to-indigo-400`,
    plus: "text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500",
    searchRing: "focus:ring-indigo-500",
    btn: "bg-indigo-600 text-white rounded-study hover:bg-indigo-700 transition-colors",
    spinner: "border-indigo-600",
    progress: "bg-indigo-600",
    focusField:
      "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30",
    selectedCard: "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    textMuted: "text-indigo-600/80 dark:text-indigo-400/80",
    ring: "focus-visible:ring-indigo-500",
    playActive: "border-indigo-500 bg-indigo-600 text-white",
    playIdle:
      "border-white/15 bg-white/10 text-white group-hover:border-indigo-400/60 group-hover:bg-indigo-500/15",
    eqBar: "bg-indigo-500",
  },
};

export function studyFlowAccent(
  accent: StudyFlowAccent = "default"
): StudyFlowAccentClasses {
  return STUDY_FLOW_ACCENTS[accent];
}
