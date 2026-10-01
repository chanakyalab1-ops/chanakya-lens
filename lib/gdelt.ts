// GdeltArticle: shared article type used by newscatcher, thenewsapi, and the
// GDELT DOC search below. sourcecountry is snake_case to match the raw API
// field name used in those files.
export type GdeltArticle = {
  title: string;
  url: string;
  domain: string;
  sourcecountry: string;
  seendate?: string;
  tone?: number;
  queryTag?: string;
};

export type GdeltFetchResult = {
  articles: Array<GdeltArticle & { queryTag: string }>;
  queriesAttempted: number;
  queriesSucceeded: number;
  queriesFailed: number;
  failureDetails: string[];
};

// Fetches up to 25 deduplicated articles (one per domain) from GDELT DOC 2.0.
// Used as a pre-generation enrichment step in anthropic-server.ts.
// Returns [] on any error so callers never need to handle failures.
export async function fetchGdeltCoverage(query: string): Promise<GdeltArticle[]> {
  if (!query.trim()) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const url =
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encoded}&mode=artlist&maxrecords=75&format=json`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = await res.json();
    const raw: Array<{
      title?: string;
      url?: string;
      domain?: string;
      sourcecountry?: string;
      seendate?: string;
    }> = data?.articles ?? [];

    const seenDomains = new Set<string>();
    const articles: GdeltArticle[] = [];

    for (const a of raw) {
      if (!a.url || !a.title || !a.domain) continue;
      if (seenDomains.has(a.domain)) continue;
      seenDomains.add(a.domain);
      articles.push({
        title: a.title,
        url: a.url,
        domain: a.domain,
        sourcecountry: a.sourcecountry ?? "",
        seendate: a.seendate,
      });
      if (articles.length >= 25) break;
    }

    return articles;
  } catch (err) {
    console.error("[gdelt] fetchGdeltCoverage failed:", err);
    throw err;
  }
}

// Groups a list of articles by sourcecountry for display in prompts.
export function groupByCountry(articles: GdeltArticle[]): Map<string, GdeltArticle[]> {
  const map = new Map<string, GdeltArticle[]>();
  for (const a of articles) {
    const country = a.sourcecountry || "Unknown";
    if (!map.has(country)) map.set(country, []);
    map.get(country)!.push(a);
  }
  return map;
}

// Returns a plain { country: count } record suitable for storing in Supabase JSONB.
export function countByCountry(articles: GdeltArticle[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const a of articles) {
    const country = a.sourcecountry || "Unknown";
    result[country] = (result[country] ?? 0) + 1;
  }
  return result;
}
