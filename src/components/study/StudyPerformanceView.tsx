import { Link } from "react-router-dom";
import type { UserStats } from "../../types/study";
import { formatStudyDuration } from "../../utils/studyStreak";
import StudySectionHeader from "./StudySectionHeader";
import {
  buildDailySecondsMap,
  computeYearStats,
  formatHoursMinutes,
  formatHoursMinutesLong,
  formatMonthDayRange,
  formatShortDate,
  heatLevel,
  monthLabel,
  peakWeek,
  weeklyHoursForYear,
} from "../../utils/studyPerformanceAnalytics";

type StudyPerformanceViewProps = {
  userStats: UserStats;
  resolveSetTitle: (studySetId: string) => string;
};

const perfCardClass =
  "rounded-study border p-6 sm:p-8 bg-white border-gray-200 text-gray-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100";

function StatCell({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">
        {value}
      </p>
    </div>
  );
}

function YearlySparkline({
  weeks,
  peak,
}: {
  weeks: { seconds: number }[];
  peak: ReturnType<typeof peakWeek>;
}) {
  const width = 800;
  const height = 140;
  const padX = 8;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const maxSec = Math.max(...weeks.map((w) => w.seconds), 1);
  const n = Math.max(weeks.length - 1, 1);

  const points = weeks.map((w, i) => {
    const x = padX + (i / n) * innerW;
    const y = padY + innerH - (w.seconds / maxSec) * innerH;
    return { x, y, seconds: w.seconds };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const peakPoint = points.reduce(
    (best, p) => (p.seconds > best.seconds ? p : best),
    points[0]
  );

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[140px]"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polyline
          fill="none"
          stroke="#fda4af"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          points={line}
        />
        {peakPoint && peakPoint.seconds > 0 ? (
          <>
            <line
              x1={peakPoint.x}
              y1={padY}
              x2={peakPoint.x}
              y2={height - padY}
              stroke="#fda4af"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <circle cx={peakPoint.x} cy={peakPoint.y} r="5" fill="#fda4af" />
          </>
        ) : null}
      </svg>
      {peak ? (
        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">
          Peak week: {formatMonthDayRange(peak.weekStart, peak.weekEnd)} ·{" "}
          {formatHoursMinutesLong(peak.seconds)}
        </p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">
          No weekly activity yet.
        </p>
      )}
    </div>
  );
}

function ConsistencyHeatmap({
  year,
  daily,
}: {
  year: number;
  daily: Map<string, number>;
}) {
  let maxDay = 0;
  daily.forEach((s) => {
    if (s > maxDay) maxDay = s;
  });

  const heatClass = (level: number) => {
    if (level === 0) return "bg-gray-200 dark:bg-zinc-800";
    if (level === 1) return "bg-rose-950";
    if (level === 2) return "bg-rose-900";
    if (level === 3) return "bg-rose-700";
    return "bg-rose-400";
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 12 }, (_, month) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const seconds = daily.get(key) || 0;
          const level = heatLevel(seconds, maxDay);
          cells.push(
            <span
              key={key}
              className={`h-2.5 w-2.5 rounded-sm ${heatClass(level)}`}
              title={`${key}: ${formatHoursMinutesLong(seconds)}`}
            />
          );
        }
        return (
          <div key={month}>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-zinc-500 mb-2">
              {monthLabel(month)}
            </p>
            <div className="flex flex-wrap gap-1">{cells}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function StudyPerformanceView({
  userStats,
  resolveSetTitle,
}: StudyPerformanceViewProps) {
  const year = new Date().getFullYear();
  const stats = computeYearStats(
    userStats.studyHistory,
    year,
    userStats.longestStreak
  );
  const daily = buildDailySecondsMap(userStats.studyHistory, year);
  const weeks = weeklyHoursForYear(userStats.studyHistory, year);
  const peak = peakWeek(weeks);

  const sessions = [...userStats.studyHistory]
    .filter((s) => {
      const start =
        s.startTime instanceof Date ? s.startTime : new Date(s.startTime);
      return start.getFullYear() === year;
    })
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

  const summaryLine =
    stats.studyDayCount > 0
      ? `You studied ${formatHoursMinutesLong(stats.totalSeconds)} across ${stats.studyDayCount} days in ${year}.`
      : `No study time recorded for ${year} yet.`;

  return (
    <div className="w-full max-w-4xl self-start flex flex-col gap-6 pb-20">
      <div className={perfCardClass}>
        <StudySectionHeader
          className="mb-8"
          title="Year insights"
          description={summaryLine}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-6 mb-8">
          <StatCell
            label="Total hours"
            value={formatHoursMinutes(stats.totalSeconds)}
          />
          <StatCell
            label="Avg hours / week"
            value={formatHoursMinutes(Math.round(stats.avgSecondsPerWeek))}
          />
          <StatCell
            label="Study days"
            value={`${stats.studyDayCount}/365`}
          />
          <StatCell
            label="Total sessions"
            value={stats.sessionCount > 0 ? String(stats.sessionCount) : "—"}
          />
          <StatCell
            label="Best streak"
            value={`${stats.bestStreakDays} DAYS`}
          />
          <StatCell
            label="Most consistent month"
            value={
              stats.mostConsistentMonth
                ? monthLabel(stats.mostConsistentMonth.month)
                : "—"
            }
          />
          <StatCell
            label="Most productive month"
            value={
              stats.mostProductiveMonth
                ? `${monthLabel(stats.mostProductiveMonth.month)} · ${formatHoursMinutes(stats.mostProductiveMonth.seconds)}`
                : "—"
            }
            className="sm:col-span-2"
          />
        </div>

        <div className="border-t border-gray-200 dark:border-zinc-800 pt-6">
          <StudySectionHeader
            className="mb-3"
            title="Highlights"
            description="Best days, streaks, and personal records for this year."
          />
          <ul className="space-y-2 text-sm text-gray-600 dark:text-zinc-300">
            <li>
              Best study day:{" "}
              {stats.bestDay
                ? `${formatShortDate(stats.bestDay.date)} · ${formatHoursMinutesLong(stats.bestDay.seconds)}`
                : "—"}
            </li>
            <li>
              Longest streak: {stats.bestStreakDays} days
              {stats.longestStreakRange
                ? ` (${formatMonthDayRange(
                    stats.longestStreakRange.start,
                    stats.longestStreakRange.end
                  )})`
                : ""}
            </li>
            <li>
              Best continuous (single session):{" "}
              {formatStudyDuration(userStats.bestContinuousStudySeconds)}
            </li>
            <li>
              Current daily streak: {userStats.currentStreak} days · Level{" "}
              {userStats.level} · {userStats.totalXP} XP
            </li>
          </ul>
        </div>
      </div>

      <div className={perfCardClass}>
        <StudySectionHeader
          className="mb-4"
          title="Yearly sparkline"
          description="How many hours you studied each week this year."
        />
        <YearlySparkline weeks={weeks} peak={peak} />
      </div>

      <div className={perfCardClass}>
        <StudySectionHeader
          className="mb-6"
          title="Consistency heatmap"
          description="Daily study activity across the year—darker squares mean more time."
        />
        <ConsistencyHeatmap year={year} daily={daily} />
      </div>

      <div
        className={`${perfCardClass} p-0 sm:p-0 overflow-hidden`}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
          <StudySectionHeader
            title={`Session log · ${year}`}
            description="Individual study sessions, newest first."
          />
        </div>
        {sessions.length === 0 ? (
          <p className="px-6 py-8 text-gray-500 dark:text-zinc-500 text-sm">
            No sessions yet.{" "}
            <Link
              to="/study"
              className="text-rose-400 font-medium hover:underline"
            >
              Start studying
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-zinc-800 max-h-80 overflow-y-auto">
            {sessions.map((session) => {
              const start =
                session.startTime instanceof Date
                  ? session.startTime
                  : new Date(session.startTime);
              return (
                <li
                  key={session.id}
                  className="px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-zinc-200 truncate">
                      {resolveSetTitle(session.studySetId)}
                    </p>
                    <p className="text-gray-500 dark:text-zinc-500 text-xs">
                      {start.toLocaleDateString()}{" "}
                      {start.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-gray-500 dark:text-zinc-400 text-xs tabular-nums">
                    <span>{formatStudyDuration(session.duration)}</span>
                    <span>{session.cardsReviewed} cards</span>
                    <span className="text-rose-400">+{session.xpEarned} XP</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
