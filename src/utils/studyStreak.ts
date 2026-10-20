export function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function calendarDaysSince(lastStudyDate: Date, from: Date = new Date()): number {
  const last = startOfLocalDay(lastStudyDate).getTime();
  const today = startOfLocalDay(from).getTime();
  return Math.floor((today - last) / (24 * 60 * 60 * 1000));
}

export function streakAfterCalendarGap(
  lastStudyDate: Date | undefined,
  storedStreak: number
): number {
  if (!lastStudyDate || storedStreak <= 0) return 0;
  const gap = calendarDaysSince(lastStudyDate);
  if (gap >= 2) return 0;
  return storedStreak;
}

export function formatStudyDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
