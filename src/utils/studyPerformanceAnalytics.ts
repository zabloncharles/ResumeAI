import type { StudySession } from "../types/study";

export function formatHoursMinutes(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}H ${m}M`;
}

export function formatHoursMinutesLong(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function sessionStart(session: StudySession): Date {
  return session.startTime instanceof Date
    ? session.startTime
    : new Date(session.startTime);
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildDailySecondsMap(
  sessions: StudySession[],
  year: number
): Map<string, number> {
  const map = new Map<string, number>();
  for (const session of sessions) {
    const start = sessionStart(session);
    if (start.getFullYear() !== year) continue;
    const key = dateKey(start);
    map.set(key, (map.get(key) || 0) + session.duration);
  }
  return map;
}

export type YearPerformanceStats = {
  year: number;
  totalSeconds: number;
  studyDayCount: number;
  sessionCount: number;
  avgSecondsPerWeek: number;
  bestStreakDays: number;
  longestStreakRange: { start: Date; end: Date } | null;
  bestDay: { date: Date; seconds: number } | null;
  mostProductiveMonth: { month: number; seconds: number } | null;
  mostConsistentMonth: { month: number; dayCount: number } | null;
};

export function computeYearStats(
  sessions: StudySession[],
  year: number,
  longestStreakStored: number
): YearPerformanceStats {
  const daily = buildDailySecondsMap(sessions, year);
  let totalSeconds = 0;
  daily.forEach((sec) => {
    totalSeconds += sec;
  });

  const studyDayCount = daily.size;
  const sessionCount = sessions.filter(
    (s) => sessionStart(s).getFullYear() === year
  ).length;

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksInYear = Math.max(
    1,
    Math.ceil((yearEnd.getTime() - yearStart.getTime()) / msPerWeek)
  );
  const avgSecondsPerWeek = totalSeconds / weeksInYear;

  let bestDay: { date: Date; seconds: number } | null = null;
  daily.forEach((seconds, key) => {
    if (!bestDay || seconds > bestDay.seconds) {
      bestDay = { date: new Date(key + "T12:00:00"), seconds };
    }
  });

  const monthTotals = new Array(12).fill(0);
  const monthDayCounts = new Array(12).fill(0);
  daily.forEach((seconds, key) => {
    const d = new Date(key + "T12:00:00");
    const m = d.getMonth();
    monthTotals[m] += seconds;
    monthDayCounts[m] += 1;
  });

  let mostProductiveMonth: { month: number; seconds: number } | null = null;
  monthTotals.forEach((seconds, month) => {
    if (seconds <= 0) return;
    if (!mostProductiveMonth || seconds > mostProductiveMonth.seconds) {
      mostProductiveMonth = { month, seconds };
    }
  });

  let mostConsistentMonth: { month: number; dayCount: number } | null = null;
  monthDayCounts.forEach((dayCount, month) => {
    if (dayCount <= 0) return;
    if (
      !mostConsistentMonth ||
      dayCount > mostConsistentMonth.dayCount
    ) {
      mostConsistentMonth = { month, dayCount };
    }
  });

  const sortedDays = [...daily.keys()].sort();
  let bestRun = 0;
  let runStart = sortedDays[0];
  let runEnd = sortedDays[0];
  let curStart = sortedDays[0];
  let curLen = 0;
  let bestRange: { start: Date; end: Date } | null = null;

  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      curLen = 1;
      curStart = sortedDays[i];
    } else {
      const prev = new Date(sortedDays[i - 1] + "T12:00:00");
      const cur = new Date(sortedDays[i] + "T12:00:00");
      const diffDays = Math.round(
        (cur.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (diffDays === 1) {
        curLen += 1;
      } else {
        if (curLen > bestRun) {
          bestRun = curLen;
          runStart = curStart;
          runEnd = sortedDays[i - 1];
        }
        curStart = sortedDays[i];
        curLen = 1;
      }
    }
  }
  if (curLen > bestRun) {
    bestRun = curLen;
    runStart = curStart;
    runEnd = sortedDays[sortedDays.length - 1];
  }
  if (bestRun > 0) {
    bestRange = {
      start: new Date(runStart + "T12:00:00"),
      end: new Date(runEnd + "T12:00:00"),
    };
  }

  const bestStreakDays = Math.max(longestStreakStored, bestRun);

  return {
    year,
    totalSeconds,
    studyDayCount,
    sessionCount,
    avgSecondsPerWeek,
    bestStreakDays,
    longestStreakRange: bestRange,
    bestDay,
    mostProductiveMonth,
    mostConsistentMonth,
  };
}

export type WeekHours = {
  weekStart: Date;
  weekEnd: Date;
  seconds: number;
};

export function weeklyHoursForYear(
  sessions: StudySession[],
  year: number
): WeekHours[] {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const weeks: WeekHours[] = [];

  let cursor = new Date(jan1);
  cursor.setHours(0, 0, 0, 0);
  const day = cursor.getDay();
  cursor.setDate(cursor.getDate() - day);

  while (cursor <= dec31) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let seconds = 0;
    for (const session of sessions) {
      const start = sessionStart(session);
      if (start >= weekStart && start <= weekEnd) {
        seconds += session.duration;
      }
    }

    weeks.push({ weekStart: new Date(weekStart), weekEnd: new Date(weekEnd), seconds });
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

export function peakWeek(weeks: WeekHours[]): WeekHours | null {
  let peak: WeekHours | null = null;
  for (const w of weeks) {
    if (!peak || w.seconds > peak.seconds) peak = w;
  }
  return peak?.seconds ? peak : null;
}

export function heatLevel(seconds: number, maxSeconds: number): 0 | 1 | 2 | 3 | 4 {
  if (seconds <= 0) return 0;
  if (maxSeconds <= 0) return 1;
  const ratio = seconds / maxSeconds;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

export function monthLabel(monthIndex: number): string {
  return new Date(2000, monthIndex, 1)
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMonthDayRange(start: Date, end: Date): string {
  const a = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const b = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${a} – ${b}`;
}
