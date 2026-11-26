// Consecutive days with at least one story read, counting back from today (or
// from yesterday, so a streak is not lost before the reader opens today's news).
export function readingStreak(readAt: string[], now = Date.now()): number {
  const day = (t: number) => new Date(t).toISOString().slice(0, 10);
  const days = new Set(readAt.map((d) => d.slice(0, 10)));
  let cursor = now;
  if (!days.has(day(cursor))) cursor -= 86400000;
  let n = 0;
  while (days.has(day(cursor))) {
    n++;
    cursor -= 86400000;
  }
  return n;
}
