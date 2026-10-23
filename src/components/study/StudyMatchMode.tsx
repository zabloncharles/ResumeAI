import { useEffect, useMemo, useRef, useState } from "react";
import type { Flashcard } from "../../types/study";
import { buildMatchRounds } from "../../utils/studyQueue";

const PAIRS_PER_ROUND = 6;

type MatchTile = {
  cardId: string;
  text: string;
};

type Selection = {
  side: "term" | "def";
  cardId: string;
};

type StudyMatchModeProps = {
  cards: Flashcard[];
  accent?: "default" | "violet";
  onCorrect: (cardId: string) => void;
  onIncorrect: (cardId: string) => void;
  onProgress?: (matchedCount: number, total: number) => void;
  onComplete: () => void;
  onInteract?: () => void;
};

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function formatMatchTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function StudyMatchMode({
  cards,
  accent = "default",
  onCorrect,
  onIncorrect,
  onProgress,
  onComplete,
  onInteract,
}: StudyMatchModeProps) {
  const structureKey = useMemo(
    () => cards.map((card) => card.id).join("|"),
    [cards]
  );
  const cardsById = useMemo(() => {
    const map = new Map<string, Flashcard>();
    for (const card of cards) map.set(card.id, card);
    return map;
  }, [cards]);
  const cardIds = useMemo(
    () => (structureKey ? structureKey.split("|") : []),
    [structureKey]
  );
  const rounds = useMemo(() => {
    const ordered = cardIds
      .map((id) => cardsById.get(id))
      .filter((card): card is Flashcard => Boolean(card));
    return buildMatchRounds(ordered, PAIRS_PER_ROUND);
  }, [cardIds, cardsById]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [termTiles, setTermTiles] = useState<MatchTile[]>([]);
  const [defTiles, setDefTiles] = useState<MatchTile[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [popIds, setPopIds] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [wrongPair, setWrongPair] = useState<Selection[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [totalMatched, setTotalMatched] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [bestRoundMs, setBestRoundMs] = useState<number | null>(null);
  const [lastRoundMs, setLastRoundMs] = useState<number | null>(null);
  const [showClearBurst, setShowClearBurst] = useState(false);

  const roundStartedAtRef = useRef<number | null>(null);
  const timerActiveRef = useRef(false);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const isViolet = accent === "violet";
  const roundCards = rounds[roundIndex] ?? [];
  const roundSize = roundCards.length;

  const startRound = (index: number, roundList = rounds) => {
    const batch = roundList[index] ?? [];
    setTermTiles(
      shuffle(batch.map((card) => ({ cardId: card.id, text: card.front })))
    );
    setDefTiles(
      shuffle(batch.map((card) => ({ cardId: card.id, text: card.back })))
    );
    setMatchedIds(new Set());
    setPopIds(new Set());
    setSelection(null);
    setWrongPair(null);
    setLocked(false);
    setRoundComplete(false);
    setShowClearBurst(false);
    setElapsedMs(0);
    setLastRoundMs(null);
    roundStartedAtRef.current = Date.now();
    timerActiveRef.current = true;
  };

  useEffect(() => {
    setRoundIndex(0);
    setTotalMatched(0);
    setStreak(0);
    setBestStreak(0);
    setBestRoundMs(null);
    if (rounds.length) startRound(0, rounds);
  }, [structureKey]);

  useEffect(() => {
    onProgressRef.current?.(totalMatched, cardIds.length);
  }, [totalMatched, cardIds.length]);

  useEffect(() => {
    if (roundComplete) return;
    const tick = window.setInterval(() => {
      if (!timerActiveRef.current || !roundStartedAtRef.current) return;
      setElapsedMs(Date.now() - roundStartedAtRef.current);
    }, 250);
    return () => window.clearInterval(tick);
  }, [roundComplete, roundIndex, structureKey]);

  const bumpStreak = () => {
    setStreak((prev) => {
      const next = prev + 1;
      setBestStreak((best) => Math.max(best, next));
      return next;
    });
  };

  const finishRoundClock = () => {
    timerActiveRef.current = false;
    const started = roundStartedAtRef.current;
    const ms = started ? Date.now() - started : elapsedMs;
    setElapsedMs(ms);
    setLastRoundMs(ms);
    setBestRoundMs((best) => (best == null ? ms : Math.min(best, ms)));
    setShowClearBurst(true);
    window.setTimeout(() => setShowClearBurst(false), 700);
  };

  const handleSelect = (side: "term" | "def", cardId: string) => {
    if (locked || matchedIds.has(cardId) || popIds.has(cardId) || roundComplete)
      return;
    onInteract?.();

    if (!selection) {
      setSelection({ side, cardId });
      return;
    }

    if (selection.side === side) {
      setSelection(selection.cardId === cardId ? null : { side, cardId });
      return;
    }

    const firstId = selection.cardId;
    const secondId = cardId;
    setLocked(true);

    if (firstId === secondId) {
      const nextMatched = new Set(matchedIds);
      nextMatched.add(firstId);
      setMatchedIds(nextMatched);
      setPopIds((prev) => new Set(prev).add(firstId));
      setSelection(null);
      setTotalMatched((n) => n + 1);
      bumpStreak();
      onCorrect(firstId);

      const roundDone = nextMatched.size >= roundSize;
      window.setTimeout(() => {
        setTermTiles((prev) => prev.filter((t) => t.cardId !== firstId));
        setDefTiles((prev) => prev.filter((t) => t.cardId !== firstId));
        setPopIds((prev) => {
          const next = new Set(prev);
          next.delete(firstId);
          return next;
        });
        if (roundDone) {
          finishRoundClock();
          setRoundComplete(true);
        }
        setLocked(false);
      }, 380);
      return;
    }

    setStreak(0);
    setWrongPair([
      { side: selection.side, cardId: firstId },
      { side, cardId: secondId },
    ]);
    onIncorrect(firstId);
    window.setTimeout(() => {
      setWrongPair(null);
      setSelection(null);
      setLocked(false);
    }, 450);
  };

  const tileClass = (side: "term" | "def", cardId: string) => {
    const isExiting = popIds.has(cardId);
    const isSelected = selection?.side === side && selection.cardId === cardId;
    const isWrong = Boolean(
      wrongPair?.some((w) => w.side === side && w.cardId === cardId)
    );

    let base =
      "relative w-full rounded-study border px-4 py-3 text-left text-sm font-medium transition-colors sm:text-base";
    if (isExiting) base += " study-match-exit";
    if (isWrong) base += " study-match-shake";

    if (isExiting) {
      return `${base} border-green-500 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200`;
    }
    if (isWrong) {
      return `${base} border-red-500 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200`;
    }
    if (isSelected) {
      return isViolet
        ? `${base} border-violet-500 bg-violet-50 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100 ring-2 ring-violet-400/40`
        : `${base} border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100 ring-2 ring-sky-400/40`;
    }
    return isViolet
      ? `${base} border-gray-200 bg-gray-50 text-gray-800 hover:border-violet-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-violet-700`
      : `${base} border-gray-200 bg-gray-50 text-gray-800 hover:border-sky-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-sky-700`;
  };

  if (!cards.length) {
    return (
      <div className="mb-8 study-round border border-gray-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-gray-600 dark:text-zinc-400">
          Add flashcards to play Match.
        </p>
      </div>
    );
  }

  const isLastRound = roundIndex >= rounds.length - 1;
  const allDone = roundComplete && isLastRound;
  const streakHot = streak >= 3;

  return (
    <div className="mb-8 w-full">
      <div className="study-round relative overflow-hidden border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {showClearBurst ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            aria-hidden
          >
            <div
              className={`h-40 w-40 rounded-full blur-2xl ${
                isViolet ? "bg-violet-400/25" : "bg-sky-400/25"
              } study-match-pop`}
            />
          </div>
        ) : null}
        <div className="relative p-6 sm:p-8">
          <div className="mb-5 text-center">
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                isViolet
                  ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"
                  : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
              }`}
            >
              Match Mode
            </span>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Tap a term, then its definition
              {rounds.length > 1
                ? ` · Round ${roundIndex + 1} of ${rounds.length}`
                : ""}
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-xs tabular-nums sm:gap-3">
            <div
              className={`rounded-full border px-3 py-1.5 font-semibold ${
                streakHot
                  ? isViolet
                    ? "border-violet-400 bg-violet-100 text-violet-800 dark:border-violet-500 dark:bg-violet-950 dark:text-violet-100"
                    : "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-200"
                  : "border-gray-200 bg-gray-50 text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              {streak > 0 ? `${streak}× streak` : "No streak"}
              {bestStreak > 0 ? (
                <span className="ml-1.5 font-normal text-zinc-400 dark:text-zinc-500">
                  best {bestStreak}
                </span>
              ) : null}
            </div>
            <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 font-semibold text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {formatMatchTime(elapsedMs)}
              {bestRoundMs != null ? (
                <span className="ml-1.5 font-normal text-zinc-400 dark:text-zinc-500">
                  best {formatMatchTime(bestRoundMs)}
                </span>
              ) : null}
            </div>
            <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {matchedIds.size}/{roundSize} · {totalMatched}/{cards.length}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Terms
              </p>
              {termTiles.map((tile) => (
                <button
                  key={`term-${tile.cardId}`}
                  type="button"
                  disabled={
                    matchedIds.has(tile.cardId) ||
                    popIds.has(tile.cardId) ||
                    locked
                  }
                  onClick={() => handleSelect("term", tile.cardId)}
                  className={tileClass("term", tile.cardId)}
                >
                  {popIds.has(tile.cardId) ? (
                    <span className="study-match-burst" aria-hidden />
                  ) : null}
                  {tile.text}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Definitions
              </p>
              {defTiles.map((tile) => (
                <button
                  key={`def-${tile.cardId}`}
                  type="button"
                  disabled={
                    matchedIds.has(tile.cardId) ||
                    popIds.has(tile.cardId) ||
                    locked
                  }
                  onClick={() => handleSelect("def", tile.cardId)}
                  className={tileClass("def", tile.cardId)}
                >
                  {popIds.has(tile.cardId) ? (
                    <span className="study-match-burst" aria-hidden />
                  ) : null}
                  {tile.text}
                </button>
              ))}
            </div>
          </div>

          {roundComplete ? (
            <div className="mt-8 text-center study-match-pop">
              <p className="mb-1 text-lg font-semibold text-gray-900 dark:text-zinc-100">
                {allDone ? "All pairs matched!" : "Round clear!"}
              </p>
              {lastRoundMs != null ? (
                <p className="mb-4 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                  Round time {formatMatchTime(lastRoundMs)}
                  {streak > 0 ? ` · ended on a ${streak}× streak` : ""}
                </p>
              ) : (
                <div className="mb-4" />
              )}
              {allDone ? (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRoundIndex(0);
                      setTotalMatched(0);
                      setStreak(0);
                      startRound(0);
                    }}
                    className={`${isViolet ? "study-btn-violet" : "study-btn"} px-6 py-3 font-semibold`}
                  >
                    Play again
                  </button>
                  <button
                    type="button"
                    onClick={onComplete}
                    className="rounded-study border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Finish
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const next = roundIndex + 1;
                    setRoundIndex(next);
                    startRound(next);
                  }}
                  className={`${isViolet ? "study-btn-violet" : "study-btn"} px-6 py-3 font-semibold`}
                >
                  Next round
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
