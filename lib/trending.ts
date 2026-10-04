import type { Story } from "./stories";
import { ALL_ENTITIES, THEMES, storiesFor } from "./lens";
import { recentWindow } from "./signal";

export type TrendingTopic = { slug: string; name: string; count: number };

const DAY = 24 * 60 * 60 * 1000;
const BASELINE_DAYS = 14;
const MIN_STORIES = 2;
// Countries are the broadest topics, so they get at most this many chips.
const MAX_COUNTRIES = 3;
// Countries a theme already covers, so "Iran" and "Iran war" don't both show.
const COVERED_BY_THEME = new Set(THEMES.flatMap((t) => t.keywords));

// Topics whose coverage has jumped. A topic that is always in the news (the
// US, China) shouldn't sit on top just for being big, so each topic is scored
// by its stories in the recent window against how many it normally gets in a
// window that long over the previous two weeks.
export function trendingTopics(stories: Story[], now: number = Date.now(), limit = 8): TrendingTopic[] {
  const window = recentWindow(stories, now);
  if (window.stories.length === 0) return [];
  const windowMs = window.hours * 60 * 60 * 1000;
  const windowSlugs = new Set(window.stories.map((s) => s.slug));
  const prior = stories.filter((s) => {
    const age = now - new Date(s.publishedAt).getTime();
    return age >= windowMs && age < windowMs + BASELINE_DAYS * DAY;
  });

  const ranked = ALL_ENTITIES.filter((e) => !(e.kind === "country" && COVERED_BY_THEME.has(e.name))).map((entity) => {
    const count = storiesFor(entity, window.stories).filter((s) => windowSlugs.has(s.slug)).length;
    const normal = (storiesFor(entity, prior).length / BASELINE_DAYS) * (windowMs / DAY);
    return { slug: entity.slug, name: entity.name, kind: entity.kind, count, score: count / (normal + 1) };
  })
    .filter((t) => t.count >= MIN_STORIES)
    .sort((a, b) => b.score - a.score || b.count - a.count);

  const out: TrendingTopic[] = [];
  let countries = 0;
  for (const t of ranked) {
    if (out.length >= limit) break;
    if (t.kind === "country") {
      if (countries >= MAX_COUNTRIES) continue;
      countries++;
    }
    out.push({ slug: t.slug, name: t.name, count: t.count });
  }
  return out;
}
