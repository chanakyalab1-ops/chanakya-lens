// GDELT DOC 2.0 API client — free, no key required.
// Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
// Returns metadata + link + short excerpt only — never full article text,
// which keeps us on the right side of copyright (see project notes on sourcing).

export type GdeltArticle = {
  url: string;
  title: string;
  domain: string;
  sourcecountry: string;
  seendate: string; // "YYYYMMDDTHHMMSSZ"
  tone: number;
};

// Queries tuned to your locked editorial scope:
// geopolitical / bilateral / cross-border only — no domestic-only politics.
const QUERIES = [
  "tariff sourcecountry", // bilateral trade actions
  "export controls sanctions",
  "border conflict OR skirmish",
  "shipping lane OR strait blockade",
  "trade agreement bilateral",
  "military deployment foreign",
];

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";

export async function fetchGdeltCandidates(): Promise<
  Array<GdeltArticle & { queryTag: string }>
> {
  const results: Array<GdeltArticle & { queryTag: string }> = [];

    for (const query of QUERIES) {
    const params = new URLSearchParams({
      query,
      mode: "artlist",
      format: "json",
      maxrecords: "20",
      timespan: "24h",
      sort: "datedesc",
    });

    try {
      const res = await fetch(`${GDELT_ENDPOINT}?${params.toString()}`, {
        headers: { "User-Agent": "ChanakyaLens/1.0" },
      });
      if (!res.ok) continue;

      const data = await res.json();
      const articles: GdeltArticle[] = data?.articles ?? [];

      for (const a of articles) {
        results.push({ ...a, queryTag: query });
      }
    } catch (err) {
      console.error(`GDELT fetch failed for query "${query}":`, err);
    }

    await new Promise((resolve) => setTimeout(resolve, 5500));
  }

  return results;
}
