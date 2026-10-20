import { Link } from "react-router-dom";
import { Bars3Icon, ClockIcon } from "@heroicons/react/24/outline";
import UserAccountMenu from "../UserAccountMenu";
import bunny1 from "../../bunny1.png";

type StudySessionTopBarProps = {
  setTitle: string;
  cardLabel: string;
  timerLabel: string;
  timerIdlePaused?: boolean;
  idlePauseCountdownActive?: boolean;
  idlePauseSecondsRemaining?: number;
  onMenuClick: () => void;
  onBackToStudy: () => void;
};

function formatPauseCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function StudySessionTopBar({
  setTitle,
  cardLabel,
  timerLabel,
  timerIdlePaused = false,
  idlePauseCountdownActive = false,
  idlePauseSecondsRemaining = 60,
  onMenuClick,
  onBackToStudy,
}: StudySessionTopBarProps) {
  const timerColorClass = timerIdlePaused
    ? "text-amber-600"
    : idlePauseCountdownActive
      ? "text-red-600"
      : "text-gray-600 dark:text-zinc-400";

  const timerTitle = timerIdlePaused
    ? "Timer paused after 1 minute without activity"
    : idlePauseCountdownActive
      ? "Move or click to keep studying — timer pauses at 0:00"
      : "Session time";

  return (
    <header className="sticky top-0 z-30 flex h-[5.5rem] shrink-0 items-center gap-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 shrink-0"
        aria-label="Open study menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={onBackToStudy}
        className="inline-flex shrink-0 items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 whitespace-nowrap"
      >
        ← Back to Study
      </button>

      <Link
        to="/"
        className="lg:hidden flex items-center gap-2 shrink-0 min-w-0 rounded-lg hover:opacity-90 transition-opacity"
        aria-label="Brightfolio home"
      >
        <img src={bunny1} alt="" className="h-9 w-9 shrink-0" />
        <span className="text-base font-bold bg-gradient-to-r from-[#16aeac] to-black dark:to-white bg-clip-text text-transparent truncate">
          Brightfolio
        </span>
      </Link>

      <div className="min-w-0 flex-1 lg:hidden">
        <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">{cardLabel}</p>
      </div>

      <div className="hidden lg:flex min-w-0 flex-1 flex-col items-center justify-center px-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate max-w-md text-center">
          {setTitle}
        </p>
        <p className="text-xs text-gray-500 dark:text-zinc-500">{cardLabel}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <div
          className={`flex items-center gap-1.5 text-sm tabular-nums ${timerColorClass}`}
          title={timerTitle}
        >
          <ClockIcon className="h-5 w-5 shrink-0" />
          <span>{timerLabel}</span>
          {timerIdlePaused ? (
            <span className="text-xs font-medium uppercase tracking-wide">
              Paused
            </span>
          ) : idlePauseCountdownActive ? (
            <span className="text-xs font-semibold tabular-nums">
              · pause {formatPauseCountdown(idlePauseSecondsRemaining)}
            </span>
          ) : null}
        </div>
        <UserAccountMenu className="hidden sm:flex shrink-0" />
      </div>
    </header>
  );
}
