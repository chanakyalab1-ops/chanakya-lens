import type { ConfidenceLevel, Story } from "./stories";

export type Focus = { confidence: ConfidenceLevel | "all"; country: string; freshOnly: boolean };
export const NO_FOCUS: Focus = { confidence: "all", country: "", freshOnly: false };

export const isFocused = (f: Focus) => f.confidence !== "all" || !!f.country || f.freshOnly;

// Narrows the feed: stories with at least one effect at the chosen confidence,
// about the chosen country, and (optionally) not yet read on this device.
export function applyFocus(stories: Story[], f: Focus, read: ReadonlySet<string>): Story[] {
  return stories.filter((s) => {
    if (f.freshOnly && read.has(s.slug)) return false;
    if (f.country && !(s.subjectCountries ?? []).includes(f.country)) return false;
    if (f.confidence !== "all" && !(s.impactNodes ?? []).some((n) => n.confidence === f.confidence)) return false;
    return true;
  });
}

// The countries the current stories are about, most covered first.
export function countryOptions(stories: Story[], limit = 14): string[] {
  const counts = new Map<string, number>();
  for (const s of stories) for (const c of s.subjectCountries ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([c]) => c);
}
