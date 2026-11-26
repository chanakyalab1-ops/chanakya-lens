import { matchInterests, type Interest } from "./interests";
import type { Story } from "./stories";
import type { DigestStory } from "./digestStories";

export type WatchlistRow = DigestStory & { subject_countries?: string[] | null; created_at?: string | null };

// Today's stories that match a reader's Watchlist (topics, countries, places,
// actors and themes), newest first. Null when nothing matches, so the reader
// keeps the ordinary digest.
export function selectWatchlistDigest(stories: WatchlistRow[], interests: Interest[], limit = 6): DigestStory[] | null {
  if (interests.length === 0) return null;
  const asStories = stories.map((s) => ({ slug: s.slug, headline: s.headline, dek: s.dek, category: s.category, subjectCountries: s.subject_countries ?? [], publishedAt: s.created_at ?? new Date(0).toISOString() }) as unknown as Story);
  const matched = matchInterests(asStories, interests).map((m) => m.slug);
  if (matched.length === 0) return null;
  const bySlug = new Map(stories.map((s) => [s.slug, s]));
  return matched.slice(0, limit).map((slug) => bySlug.get(slug)!);
}
