import type { Story } from "./stories";

export type Comparison = { both: Story[]; onlyA: Story[]; onlyB: Story[] };

// Splits two Lens pages' stories into those on both, only the first, only the second.
export function compareStories(a: Story[], b: Story[]): Comparison {
  const inB = new Set(b.map((s) => s.slug));
  const inA = new Set(a.map((s) => s.slug));
  return { both: a.filter((s) => inB.has(s.slug)), onlyA: a.filter((s) => !inB.has(s.slug)), onlyB: b.filter((s) => !inA.has(s.slug)) };
}
