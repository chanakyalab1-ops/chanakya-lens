type SourceLike = { url: string; title: string; domain: string; sourceCountry: string | null };

export type SourceGroup = { title: string; url: string; label: string; others: { domain: string; url: string }[] };

// Syndicated stories show up under many outlets with the same headline. One
// row per headline: the first outlet's link, and the rest counted as "others".
export function groupSources(sources: SourceLike[]): SourceGroup[] {
  const groups = new Map<string, SourceGroup>();
  for (const s of sources) {
    const key = s.title.trim().toLowerCase();
    const existing = groups.get(key);
    if (existing) existing.others.push({ domain: s.domain, url: s.url });
    else groups.set(key, { title: s.title, url: s.url, label: s.sourceCountry ?? s.domain, others: [] });
  }
  return [...groups.values()];
}
