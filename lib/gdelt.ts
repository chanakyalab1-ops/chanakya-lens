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
//
// NOTE on theme: operators — GDELT's `theme:` filter uses fixed codes from
// its GKG taxonomy (not free text). Codes like "MILITARY", "BLOCKADE",
// "SANCTIONS", "TRADE_DISPUTE" have NOT been verified against GDELT's
// actual codebook. Using an invalid code risks the same silent-failure
// bug as the old "tariff sourcecountry" query. Verify real codes at
// http://data.gdeltproject.org/api/v2/guides/LOOKUP-GKGTHEMES.TXT
// before adding any theme: queries back in.
const QUERIES = [
  'tariff (import OR bilateral OR retaliation) -"sales tax" -"property tax"',
  "export controls sanctions",
  "border conflict OR skirmish",
  '("Strait of Hormuz" OR "Malacca" OR "Bab el-Mandeb" OR "Suez Canal" OR "Taiwan Strait") (blockade OR naval OR transit OR interception)',
  '("critical minerals" OR "rare earths" OR "semiconductor export" OR "lithium reserves" OR "uranium enrichment")',
  '("subsea cable" OR "undersea pipeline" OR "cross-border pipeline" OR "Nord Stream" OR "grid interconnection") (sabotage OR cut OR agreement OR transit)',
  '("joint military exercise" OR "naval drills" OR "arms sale" OR "defense pact" OR "bilateral security")',
  '("EEZ violation" OR "airspace intrusion" OR "ADIZ" OR "disputed waters" OR "territorial claim")',
];

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";

export async function fetchGdeltCandidates(): Promise
  Array<GdeltArticle & { queryTag: string }>
> {
  const results: Array<GdeltArticle & { queryTag: string }> = [];

  for (const query of QUERIES) {
    const params = new URLSearchParams({
      query: `${query} sourcelang:eng`,
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

      if (!res.ok) {
        console.error(`GDELT HTTP ${res.status} for query "${query}"`);
        await new Promise((resolve) => setTimeout(resolve, 5500));
        continue;
      }

      // Read as text first — GDELT sometimes returns a plain-text/HTML
      // error page instead of JSON (e.g. on malformed queries or
      // rate-limit throttling), and calling res.json() directly on
      // that throws an opaque SyntaxError with no useful info.
      const text = await res.text();

      let data: { articles?: GdeltArticle[] };
      try {
        data = JSON.parse(text);
      } catch {
        console.error(
          `GDELT non-JSON response for query "${query}": ${text.slice(0, 200)}`
        );
        await new Promise((resolve) => setTimeout(resolve, 5500));
        continue;
      }

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