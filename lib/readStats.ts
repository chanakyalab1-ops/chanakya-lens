export type ReadStory = { category: string; subjectCountries?: string[] };
export type Tally = { name: string; count: number };

export type ReadingMap = { total: number; categories: Tally[]; countries: Tally[]; unseen: Tally[] };

const tally = (m: Map<string, number>, limit: number): Tally[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([name, count]) => ({ name, count }));

// What a reader has read, and which countries the recent news covers that they have not opened.
export function readingMap(read: ReadStory[], recent: ReadStory[]): ReadingMap {
  const cats = new Map<string, number>();
  const readCountries = new Map<string, number>();
  for (const s of read) {
    cats.set(s.category, (cats.get(s.category) ?? 0) + 1);
    for (const c of s.subjectCountries ?? []) readCountries.set(c, (readCountries.get(c) ?? 0) + 1);
  }
  const unseen = new Map<string, number>();
  for (const s of recent) for (const c of s.subjectCountries ?? []) if (!readCountries.has(c)) unseen.set(c, (unseen.get(c) ?? 0) + 1);
  return { total: read.length, categories: tally(cats, 8), countries: tally(readCountries, 8), unseen: tally(unseen, 8) };
}
