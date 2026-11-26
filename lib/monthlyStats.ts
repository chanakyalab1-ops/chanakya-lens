import type { Story } from "./stories";
import { SYSTEMS, storiesFor } from "./lens";
import { inferStoryRegion, REGIONS, type Region } from "./regions";

export type Tally = { name: string; count: number };
export type EffectRow = { category: string; direct: number; likely: number; possible: number };
export type MonthlyStats = {
  period: string;
  total: number;
  countries: Tally[];
  chokepoints: Tally[];
  effects: EffectRow[];
  regions: Tally[];
  leastCovered: string | null;
  topStories: { slug: string; headline: string; category: string; direct: number }[];
};

export const isValidPeriod = (p: unknown): p is string => typeof p === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(p);
export const currentPeriod = (now = new Date()) => `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
export const periodLabel = (p: string) => new Date(`${p}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

const top = (m: Map<string, number>, n: number): Tally[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([name, count]) => ({ name, count }));

// Everything the Lens Monthly charts and its draft need, from one month's stories.
// Only counts what we actually published: nothing here is estimated.
export function monthlyStats(stories: Story[], period: string): MonthlyStats {
  const countries = new Map<string, number>();
  const effects = new Map<string, EffectRow>();
  const regionCounts = new Map<string, number>(REGIONS.map((r) => [r, 0]));

  for (const s of stories) {
    for (const c of s.subjectCountries ?? []) countries.set(c, (countries.get(c) ?? 0) + 1);
    const region: Region = inferStoryRegion(s);
    if (region !== "International") regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
    if (s.impactNodes?.length) {
      const row = effects.get(s.category) ?? { category: s.category, direct: 0, likely: 0, possible: 0 };
      for (const n of s.impactNodes) row[n.confidence]++;
      effects.set(s.category, row);
    }
  }

  const chokepoints = SYSTEMS.map((e) => ({ name: e.name, count: storiesFor(e, stories).length })).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
  const regions = [...regionCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const leastCovered = stories.length >= 10 && regions.length ? regions[regions.length - 1].name : null;

  const topStories = stories
    .map((s) => ({ slug: s.slug, headline: s.headline, category: s.category, direct: (s.impactNodes ?? []).filter((n) => n.confidence === "direct").length }))
    .sort((a, b) => b.direct - a.direct)
    .slice(0, 8);

  return {
    period,
    total: stories.length,
    countries: top(countries, 10),
    chokepoints,
    effects: [...effects.values()].sort((a, b) => b.direct + b.likely + b.possible - (a.direct + a.likely + a.possible)),
    regions,
    leastCovered,
    topStories,
  };
}
