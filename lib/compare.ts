import type { Story } from "./stories";

export type Comparison = { both: Story[]; onlyA: Story[]; onlyB: Story[] };

// Splits two Lens pages' stories into those on both, only the first, only the second.
export function compareStories(a: Story[], b: Story[]): Comparison {
  const inB = new Set(b.map((s) => s.slug));
  const inA = new Set(a.map((s) => s.slug));
  return { both: a.filter((s) => inB.has(s.slug)), onlyA: a.filter((s) => !inB.has(s.slug)), onlyB: b.filter((s) => !inA.has(s.slug)) };
}

export type SideSummary = {
  total: number;
  last30: number;
  developing: number;
  avgSources: number | null;
  topCategories: [string, number][];
  topSourceCountries: [string, number][];
  newest: string | null;
};

const top = (counts: Map<string, number>, n: number): [string, number][] =>
  [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, n);

// Headline numbers for one side of a comparison: how much we cover, how recently,
// how well-sourced, and which categories and countries the coverage comes from.
export function summarizeSide(stories: Story[], now: number = Date.now()): SideSummary {
  const cats = new Map<string, number>();
  const srcs = new Map<string, number>();
  let last30 = 0;
  let developing = 0;
  let srcTotal = 0;
  let newest: number | null = null;
  for (const s of stories) {
    const t = new Date(s.publishedAt).getTime();
    if (Number.isFinite(t)) {
      if (now - t <= 30 * 86400000) last30++;
      if (newest === null || t > newest) newest = t;
    }
    if (s.status === "developing") developing++;
    srcTotal += s.sources?.length ?? 0;
    if (s.category) cats.set(s.category, (cats.get(s.category) ?? 0) + 1);
    for (const src of s.sources ?? []) {
      if (src.sourceCountry) srcs.set(src.sourceCountry, (srcs.get(src.sourceCountry) ?? 0) + 1);
    }
  }
  return {
    total: stories.length,
    last30,
    developing,
    avgSources: stories.length ? Math.round((srcTotal / stories.length) * 10) / 10 : null,
    topCategories: top(cats, 3),
    topSourceCountries: top(srcs, 3),
    newest: newest === null ? null : new Date(newest).toISOString(),
  };
}

// One plain sentence on how much two sides overlap.
export function overlapSentence(nameA: string, nameB: string, c: Comparison): string {
  const totalA = c.both.length + c.onlyA.length;
  const totalB = c.both.length + c.onlyB.length;
  if (totalA === 0 && totalB === 0) return `We have no stories on ${nameA} or ${nameB} yet.`;
  if (c.both.length === 0) return `${nameA} and ${nameB} don't share any stories yet, so they are covered as separate threads.`;
  const pa = totalA ? Math.round((c.both.length / totalA) * 100) : 0;
  const pb = totalB ? Math.round((c.both.length / totalB) * 100) : 0;
  const n = c.both.length;
  return `${n} ${n === 1 ? "story covers" : "stories cover"} both. That is ${pa}% of our ${nameA} coverage and ${pb}% of our ${nameB} coverage.`;
}
