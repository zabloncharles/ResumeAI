import { useEffect, useMemo, useState } from "react";
import type { Flashcard } from "../../types/study";
import StudyFarmSvg, { type FarmStageId } from "./StudyFarmSvg";

type FarmStage = {
  id: FarmStageId;
  minPercent: number;
  title: string;
  blurb: string;
};

const FARM_STAGES: FarmStage[] = [
  {
    id: "empty",
    minPercent: 0,
    title: "Empty land",
    blurb: "Bare soil. Study correctly to grow — wrong answers set you back.",
  },
  {
    id: "seeds",
    minPercent: 15,
    title: "Water & plots",
    blurb: "Pond and field grid appear. Keep accuracy high.",
  },
  {
    id: "sprouts",
    minPercent: 35,
    title: "Crops planted",
    blurb: "Vegetable rows and wheat take root.",
  },
  {
    id: "pasture",
    minPercent: 55,
    title: "Livestock",
    blurb: "Animals move in when the set is mostly solid.",
  },
  {
    id: "homestead",
    minPercent: 75,
    title: "Homestead",
    blurb: "Barn and farmhouse unlock near mastery.",
  },
  {
    id: "harvest",
    minPercent: 95,
    title: "Flourishing farm",
    blurb: "Full farm only when the set is nearly mastered.",
  },
];

type StudyFarmModeProps = {
  cards: Flashcard[];
  accent?: "default" | "violet";
  onStudyFlashcards: () => void;
  onStudyMatch: () => void;
};

function farmGrowthPercent(cards: Flashcard[]) {
  if (!cards.length) return 0;
  const avg =
    cards.reduce((acc, card) => acc + (card.mastery || 0), 0) / cards.length;
  const weakest = Math.min(...cards.map((card) => card.mastery || 0));
  const blended = avg * 0.7 + weakest * 0.3;
  return Math.min(100, Math.round(blended));
}

function stageForPercent(percent: number): FarmStage {
  let current = FARM_STAGES[0];
  for (const stage of FARM_STAGES) {
    if (percent >= stage.minPercent) current = stage;
  }
  return current;
}

function nextStage(percent: number): FarmStage | null {
  return FARM_STAGES.find((stage) => stage.minPercent > percent) ?? null;
}

export default function StudyFarmMode({
  cards,
  accent = "default",
  onStudyFlashcards,
  onStudyMatch,
}: StudyFarmModeProps) {
  const percent = useMemo(() => farmGrowthPercent(cards), [cards]);
  const stage = stageForPercent(percent);
  const upcoming = nextStage(percent);
  const isViolet = accent === "violet";
  const [celebrate, setCelebrate] = useState(false);
  const [prevStageId, setPrevStageId] = useState(stage.id);

  useEffect(() => {
    if (stage.id !== prevStageId) {
      setCelebrate(true);
      setPrevStageId(stage.id);
      const t = window.setTimeout(() => setCelebrate(false), 900);
      return () => window.clearTimeout(t);
    }
  }, [stage.id, prevStageId]);

  if (!cards.length) {
    return (
      <div className="mb-8 study-round border border-gray-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-gray-600 dark:text-zinc-400">
          Add flashcards to start growing your farm.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 w-full">
      <div className="study-round overflow-hidden border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                  isViolet
                    ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                }`}
              >
                Farm Mode
              </span>
              <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-zinc-100">
                {stage.title}
              </h2>
              <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                {stage.blurb}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-zinc-100">
                {percent}%
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                farm health · wrong answers hurt this
              </p>
            </div>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border border-zinc-800/80 shadow-inner ${
              celebrate ? "study-match-pop" : ""
            }`}
          >
            <StudyFarmSvg stageId={stage.id} className="w-full" />
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Growth</span>
              <span className="tabular-nums">
                {upcoming
                  ? `${upcoming.minPercent - percent}% to ${upcoming.title}`
                  : "Max harvest"}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-amber-100 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isViolet ? "bg-violet-500" : "bg-emerald-500"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {FARM_STAGES.map((s) => {
                const reached = percent >= s.minPercent;
                return (
                  <span
                    key={s.id}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      reached
                        ? isViolet
                          ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600"
                    }`}
                  >
                    {s.title}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStudyFlashcards}
              className={`${isViolet ? "study-btn-violet" : "study-btn"} px-6 py-3 font-semibold`}
            >
              Study to grow
            </button>
            <button
              type="button"
              onClick={onStudyMatch}
              className="rounded-study border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Play Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
