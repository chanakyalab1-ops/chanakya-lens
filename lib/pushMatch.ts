import type { Story } from "./stories";
import { getLensEntity, storiesFor } from "./lens";

export type PushTopic = { kind: "category" | "lens"; slug: string };
export type PushPrefs = { breakingOnly: boolean; topics: PushTopic[] };

export const PUSH_CATEGORIES = ["Security & Conflict", "Trade & Tariffs", "Political", "Tech & Regulation", "Resources", "Sports & Power"];
export const PUSH_DAILY_CAP = 3;
const MAX_TOPICS = 60;

export type PushStory = {
  slug: string;
  headline: string;
  dek?: string | null;
  category: string;
  status?: string | null;
  impactNodes?: { confidence: string }[] | null;
  subjectCountries?: string[] | null;
};

// The biggest stories: still developing, with a direct effect on readers.
export function isBreaking(s: PushStory): boolean {
  return s.status === "developing" && !!s.impactNodes?.some((n) => n.confidence === "direct");
}

function lensMatches(slug: string, s: PushStory): boolean {
  const entity = getLensEntity(slug);
  if (!entity) return false;
  const asStory = { slug: s.slug, headline: s.headline, dek: s.dek ?? "", category: s.category, subjectCountries: s.subjectCountries ?? [], publishedAt: new Date().toISOString() } as unknown as Story;
  return storiesFor(entity, [asStory]).length > 0;
}

// A reader gets an alert for the biggest stories if they asked for those, plus
// anything in a topic they picked.
export function matchesPrefs(story: PushStory, prefs: PushPrefs): boolean {
  if (prefs.breakingOnly && isBreaking(story)) return true;
  return prefs.topics.some((t) => (t.kind === "category" ? story.category === t.slug : lensMatches(t.slug, story)));
}

// Checks what the browser sent; returns clean preferences or null.
export function validatePrefs(raw: unknown): PushPrefs | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { breakingOnly?: unknown; topics?: unknown };
  if (!Array.isArray(r.topics) || r.topics.length > MAX_TOPICS) return null;
  const topics: PushTopic[] = [];
  for (const t of r.topics) {
    if (!t || typeof t !== "object") return null;
    const { kind, slug } = t as { kind?: unknown; slug?: unknown };
    if (typeof slug !== "string") return null;
    if (kind === "category" && PUSH_CATEGORIES.includes(slug)) topics.push({ kind, slug });
    else if (kind === "lens" && getLensEntity(slug)) topics.push({ kind, slug });
    else return null;
  }
  return { breakingOnly: r.breakingOnly === true, topics };
}

const day = (now: number) => new Date(now).toISOString().slice(0, 10);

export function canSendToday(row: { sent_day: string | null; sent_today: number | null }, now = Date.now(), cap = PUSH_DAILY_CAP): boolean {
  if (row.sent_day !== day(now)) return true;
  return (row.sent_today ?? 0) < cap;
}

export function nextCounter(row: { sent_day: string | null; sent_today: number | null }, now = Date.now()): { sent_day: string; sent_today: number } {
  return row.sent_day === day(now) ? { sent_day: day(now), sent_today: (row.sent_today ?? 0) + 1 } : { sent_day: day(now), sent_today: 1 };
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

export function buildPayload(s: PushStory, kind: "new" | "update"): { title: string; body: string; url: string; tag: string } {
  return {
    title: clip(kind === "update" ? `Update: ${s.headline}` : s.headline, 90),
    body: kind === "update" ? "New developments in a story you follow. Tap to read." : clip(s.dek?.trim() || "Tap to read how it could affect you.", 110),
    url: `/story/${s.slug}`,
    tag: s.slug,
  };
}
