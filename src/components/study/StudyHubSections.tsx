import {
  PlusIcon,
  BookOpenIcon,
  ChevronDownIcon,
  PlayCircleIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import {
  displayStudySetCategory,
  studyCategorySearchText,
} from "../../constants/studyCategories";
import type { StudySet } from "../../types/study";
import StudySectionHeader from "./StudySectionHeader";
import blueOrb from "../../blueorb.mp4";

export function getSetReviewProgress(set: StudySet) {
  const total = set.flashcards?.length || set.cardCount || 0;
  if (!total) {
    return { reviewed: 0, total: 0, percent: 0 };
  }
  const reviewed = set.flashcards.filter(
    (c) => c.mastery > 0 || c.lastReviewed
  ).length;
  return {
    reviewed,
    total,
    percent: Math.round((reviewed / total) * 100),
  };
}

export function pickJumpBackSet(sets: StudySet[]): StudySet | null {
  const withCards = sets.filter((s) => (s.flashcards?.length ?? 0) > 0);
  if (!withCards.length) return null;

  const started = withCards.filter((s) => s.progress === "started");
  let pool = started.length
    ? started
    : withCards.filter((s) => s.lastStudied);

  if (!pool.length) {
    pool = withCards.filter(
      (s) => s.progress !== "completed" && s.progress !== "not_started"
    );
  }

  if (!pool.length) {
    return [...withCards].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];
  }

  return [...pool].sort(
    (a, b) =>
      (b.lastStudied?.getTime() ?? 0) - (a.lastStudied?.getTime() ?? 0)
  )[0];
}

export function touchRecentSet(uid: string, setId: string) {
  const key = `studyRecentSets_${uid}`;
  let ids: string[] = [];
  try {
    ids = JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    ids = [];
  }
  ids = [setId, ...ids.filter((id) => id !== setId)].slice(0, 10);
  localStorage.setItem(key, JSON.stringify(ids));
}

export function getRecentSets(
  sets: StudySet[],
  uid: string,
  excludeId?: string,
  limit = 5
): StudySet[] {
  let ids: string[] = [];
  try {
    ids = JSON.parse(localStorage.getItem(`studyRecentSets_${uid}`) || "[]");
  } catch {
    ids = [];
  }

  const byId = new Map(sets.map((s) => [s.id, s]));
  const ordered: StudySet[] = [];

  for (const id of ids) {
    if (id === excludeId) continue;
    const set = byId.get(id);
    if (set) ordered.push(set);
    if (ordered.length >= limit) return ordered;
  }

  const seen = new Set(ordered.map((s) => s.id));
  const byLastStudied = [...sets]
    .filter(
      (s) =>
        s.id !== excludeId &&
        s.lastStudied &&
        !seen.has(s.id)
    )
    .sort(
      (a, b) =>
        (b.lastStudied?.getTime() ?? 0) - (a.lastStudied?.getTime() ?? 0)
    );

  for (const set of byLastStudied) {
    if (ordered.length >= limit) break;
    ordered.push(set);
  }

  return ordered;
}

export function filterSetsBySearch(sets: StudySet[], query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return sets;
  return sets.filter(
    (set) =>
      set.title.toLowerCase().includes(term) ||
      set.description.toLowerCase().includes(term) ||
      studyCategorySearchText(set).includes(term)
  );
}

type HubQuickActionsProps = {
  onCreateSet: () => void;
  onAddPublicSet: () => void;
  fromTranscriptTo?: string;
  podcastTo?: string;
};

export function StudyHubQuickActions({
  onCreateSet,
  onAddPublicSet,
  fromTranscriptTo = "/create/from-transcript",
  podcastTo = "/podcast",
}: HubQuickActionsProps) {
  return (
    <section className="w-full max-w-4xl self-start min-w-0 mb-8">
      <StudySectionHeader
        className="mb-4"
        title="Get started"
        description="Create flashcards, import a set, turn a transcript into cards, or make a teaching podcast."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onCreateSet}
          className="study-round flex items-center justify-between px-5 py-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 hover:bg-sky-100/80 dark:hover:bg-sky-950/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-zinc-950 text-sky-600 dark:text-sky-400 border border-sky-100/80 dark:border-sky-900/50 shadow-sm">
              <PlusIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100">Create a set</p>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Build flashcards</p>
            </div>
          </div>
          <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-zinc-500 rotate-[-90deg] hidden sm:block" />
        </button>

        <Link
          to={fromTranscriptTo}
          className="study-round flex items-center justify-between px-5 py-4 bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/45 hover:bg-rose-100/80 dark:hover:bg-rose-950/55 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-950 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-900/50 shadow-sm">
              <PlayCircleIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-zinc-100">
                From YouTube transcript
              </p>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                High level or detailed
              </p>
            </div>
          </div>
          <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-zinc-500 rotate-[-90deg] hidden sm:block shrink-0" />
        </Link>

        <Link
          to={podcastTo}
          className="study-round flex items-center justify-between px-5 py-4 bg-violet-50 dark:bg-violet-950/35 border border-violet-100 dark:border-violet-900/45 hover:bg-violet-100/80 dark:hover:bg-violet-950/55 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-950 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-900/50 shadow-sm">
              <MicrophoneIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-zinc-100">
                Podcast
              </p>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Emotion and mannerism you choose
              </p>
            </div>
          </div>
          <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-zinc-500 rotate-[-90deg] hidden sm:block shrink-0" />
        </Link>

        <button
          type="button"
          onClick={onAddPublicSet}
          className="study-round flex items-center justify-between px-5 py-4 bg-indigo-50 dark:bg-indigo-950/35 border border-indigo-100 dark:border-indigo-900/45 hover:bg-indigo-100/80 dark:hover:bg-indigo-950/55 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-zinc-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-900/50 shadow-sm">
              <BookOpenIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100">Import private set</p>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Code and password from the owner</p>
            </div>
          </div>
          <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-zinc-500 rotate-[-90deg] hidden sm:block" />
        </button>
      </div>
    </section>
  );
}

type JumpBackProps = {
  set: StudySet;
  onContinue: () => void;
};

export function StudyHubJumpBack({ set, onContinue }: JumpBackProps) {
  const { reviewed, total, percent } = getSetReviewProgress(set);
  const isPodcastSet = Boolean(
    typeof set.podcastId === "string" && set.podcastId
  );

  return (
    <section className="w-full max-w-4xl self-start min-w-0 mb-8">
      <StudySectionHeader
        className="mb-3"
        title="Jump back in"
        description="Continue the set you were studying most recently."
      />
      <div
        className={`study-round relative overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-black ${
          isPodcastSet
            ? "border border-violet-100 bg-violet-50/40"
            : "border border-sky-100 bg-sky-50/40"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 hidden md:block"
          aria-hidden
        >
          <video
            src={blueOrb}
            autoPlay
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full scale-125 object-cover object-right opacity-90 motion-reduce:hidden dark:invert"
          />
          <div
            className={`absolute inset-0 backdrop-blur-md dark:bg-black/50 ${
              isPodcastSet ? "bg-violet-50/55" : "bg-sky-50/55"
            }`}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-r from-[18%] via-[42%] to-[80%] dark:from-black dark:via-black/80 dark:to-black/30 ${
              isPodcastSet
                ? "from-violet-50 via-violet-50/80 to-violet-50/30"
                : "from-sky-50 via-sky-50/80 to-sky-50/30"
            }`}
          />
          <div
            className={`absolute inset-0 ${
              isPodcastSet
                ? "bg-[radial-gradient(ellipse_at_70%_50%,_rgba(139,92,246,0.14),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_70%_50%,_rgba(139,92,246,0.16),_transparent_55%)]"
                : "bg-[radial-gradient(ellipse_at_70%_50%,_rgba(2,132,199,0.14),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_70%_50%,_rgba(2,132,199,0.16),_transparent_55%)]"
            }`}
          />
        </div>
        <div className="relative z-10 p-6 md:p-8">
          <div className="md:max-w-[55%] mb-4">
            <p
              className={`mb-1 text-sm font-medium ${
                isPodcastSet
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-sky-600 dark:text-sky-400"
              }`}
            >
              {displayStudySetCategory(set)}
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {set.title}
            </h3>
            {set.description?.trim() ? (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                {set.description.trim()}
              </p>
            ) : null}
          </div>
          <div className="mb-2 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              {reviewed}/{total} cards reviewed
            </span>
            <span>{percent}%</span>
          </div>
          <div
            className={`mb-6 h-2.5 w-full rounded-full dark:bg-zinc-800 ${
              isPodcastSet ? "bg-violet-200/70" : "bg-sky-200/70"
            }`}
          >
            <div
              className={`h-2.5 rounded-full transition-all ${
                isPodcastSet ? "bg-violet-500" : "bg-sky-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <button
            type="button"
            onClick={onContinue}
            className={`${isPodcastSet ? "study-btn-violet" : "study-btn"} px-8 py-3 font-semibold`}
          >
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}

type RecentsProps = {
  sets: StudySet[];
  onOpenSet: (set: StudySet) => void;
};

export function StudyHubRecents({ sets, onOpenSet }: RecentsProps) {
  if (!sets.length) return null;

  return (
    <section className="w-full max-w-4xl self-start min-w-0 mb-10">
      <StudySectionHeader
        className="mb-3"
        title="Recents"
        description="Sets you opened lately—tap one to start studying again."
      />
      <ul className="study-round overflow-hidden bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800 shadow-sm">
        {sets.map((set) => {
          const isPodcastSet = Boolean(
            typeof set.podcastId === "string" && set.podcastId
          );
          return (
          <li key={set.id}>
            <button
              type="button"
              onClick={() => onOpenSet(set)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-colors text-left"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isPodcastSet
                    ? "bg-violet-50 text-violet-600"
                    : "bg-sky-50 text-sky-600"
                }`}
              >
                <BookOpenIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-zinc-100 truncate">{set.title}</p>
                <p className="text-sm text-gray-500 dark:text-zinc-500">
                  {set.cardCount} cards
                  {set.lastStudied
                    ? ` · ${set.lastStudied.toLocaleDateString()}`
                    : ""}
                </p>
              </div>
            </button>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
