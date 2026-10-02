import type { Story } from "./stories";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// The site reads the world through an Indian lens, so "today" is the Indian
// calendar day (IST, UTC+5:30), not the server's UTC day.
const IST_OFFSET = 5.5 * HOUR;

// The few stories that matter most right now: recent, still developing, with
// a direct impact on a reader. Falls back to the last 48 hours on a quiet day.
export function pickTodaysSignal(stories: Story[], now: number = Date.now()): Story[] {
  const rank = (s: Story) => {
    const hasDirect = s.impactNodes?.some((n) => n.confidence === "direct");
    const isDeveloping = s.status === "developing";
    let score = 0;
    if (isDeveloping) score += 2;
    if (hasDirect) score += 1;
    return score;
  };
  const age = (s: Story) => now - new Date(s.publishedAt).getTime();
  const recent = stories.filter((s) => age(s) < DAY);
  const pool = recent.length >= 3 ? recent : stories.filter((s) => age(s) < 2 * DAY);
  return [...pool]
    .sort((a, b) => rank(b) - rank(a) || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);
}

// Midnight at the start of the current IST day, as a UTC timestamp.
export function startOfTodayIST(now: number = Date.now()): number {
  return Math.floor((now + IST_OFFSET) / DAY) * DAY - IST_OFFSET;
}

// Every story published since midnight IST, newest first.
export function storiesFromToday(stories: Story[], now: number = Date.now()): Story[] {
  const start = startOfTodayIST(now);
  return stories
    .filter((s) => new Date(s.publishedAt).getTime() >= start)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
