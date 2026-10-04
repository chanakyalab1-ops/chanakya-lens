import type { Story } from "./stories";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// The window "today" covers: the last 24 hours, or the last 48 on a quiet
// stretch (fewer than 3 new stories). A rolling window rather than a calendar
// day, so a batch published at night in one timezone doesn't vanish at midnight
// in another.
export function recentWindow(stories: Story[], now: number = Date.now()): { stories: Story[]; hours: 24 | 48; label: string } {
  const within = (ms: number) => stories.filter((s) => now - new Date(s.publishedAt).getTime() < ms);
  const day = within(DAY);
  const wide = day.length >= 3;
  const pool = wide ? day : within(2 * DAY);
  const newestFirst = [...pool].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return wide
    ? { stories: newestFirst, hours: 24, label: "last 24 hours" }
    : { stories: newestFirst, hours: 48, label: "last 2 days" };
}

// The few stories that matter most right now: recent, still developing, with
// a direct impact on a reader.
export function pickTodaysSignal(stories: Story[], now: number = Date.now()): Story[] {
  const rank = (s: Story) => {
    const hasDirect = s.impactNodes?.some((n) => n.confidence === "direct");
    const isDeveloping = s.status === "developing";
    let score = 0;
    if (isDeveloping) score += 2;
    if (hasDirect) score += 1;
    return score;
  };
  return [...recentWindow(stories, now).stories]
    .sort((a, b) => rank(b) - rank(a) || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);
}
