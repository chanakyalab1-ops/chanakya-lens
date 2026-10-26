import type { WeeklyItem } from "./stories";

// Developing stories and stories with a direct reader impact first, then the
// rest in the order given (newest first). One story per category where
// possible, so the card shows a spread of topics rather than five on one.
export function pickWeekly(items: WeeklyItem[], limit = 5): WeeklyItem[] {
  const score = (s: WeeklyItem) => (s.status === "developing" ? 2 : 0) + (s.hasDirect ? 1 : 0);
  const ranked = items.map((s, i) => ({ s, i })).sort((a, b) => score(b.s) - score(a.s) || a.i - b.i).map((x) => x.s);
  const picked: WeeklyItem[] = [];
  const seen = new Set<string>();
  for (const s of ranked) {
    const cat = s.category ?? "";
    if (picked.length < limit && !seen.has(cat)) { picked.push(s); seen.add(cat); }
  }
  for (const s of ranked) {
    if (picked.length >= limit) break;
    if (!picked.includes(s)) picked.push(s);
  }
  return picked;
}

export function clip(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…";
}
