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
// its GKG taxonomy (not free text). Verify real codes at
// http://data.gdeltproject.org/api/v2/guides/LOOKUP-GKGTHEMES.TXT
// before adding any theme: queries back in.
//
// TEMPORARILY REDUCED to 4 core queries while debugging persistent 429s.
// Restore the other 4 (chokepoints, minerals, subsea infra, EEZ) once
// confirmed stable — see git history / prior version of this file.
const QUERIES = [
  'tariff (import OR bilateral OR retaliation) -"sales tax" -"property tax"',
  "export controls sanctions",
  "border conflict OR skirmish",
  '("joint military exercise" OR "naval drills" OR "arms sale" OR "defense pact" OR "bilateral security")',
];

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";

// Base delay between queries under normal conditions.
const BASE_DELAY_MS = 5500;
// Delay after hitting a 429 — much longer, to actually respect the
// rate limit window instead of hammering it again in a few seconds.
const RATE_LIMIT_BACKOFF_MS = 45000;
// How many times to retry a single query after a 429 before giving up on it.
const MAX_RETRIES_PER_QUERY = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOneQuery(
  query: string
): Promise<{ articles: GdeltArticle[]; queryTag: string } | null> {
  const params = new URLSearchParams({
    query: `${query} sourcelang:eng`,
    mode: "artlist",
    format: "json",
    maxrecords: "20",
    timespan: "24h",
    sort: "datedesc",
  });

  for (let attempt = 0; attempt <= MAX_RETRIES_PER_QUERY; attempt++) {
    try {
      const res = await fetch(`${GDELT_ENDPOINT}?${params.toString()}`, {
        headers: { "User-Agent": "ChanakyaLens/1.0" },
      });

      if (res.status === 429) {
        if (attempt < MAX_RETRIES_PER_QUERY) {
          console.warn(
            `GDELT 429 for query "${query}" — backing off ${RATE_LIMIT_BACKOFF_MS}ms before retry ${
              attempt + 1
            }/${MAX_RETRIES_PER_QUERY}`
          );
          await sleep(RATE_LIMIT_BACKOFF_MS);
          continue;
        } else {
          console.error(
            `GDELT still 429 for query "${query}" after ${MAX_RETRIES_PER_QUERY} retries — giving up on this query`
          );
          return null;
        }
      }

      if (!res.ok) {
        console.error(`GDELT HTTP ${res.status} for query "${query}"`);
        return null;
      }

      // Read as text first — GDELT sometimes returns a plain-text/HTML
      // error page instead of JSON, and calling res.json() directly on
      // that throws an opaque SyntaxError with no useful info.
      const text = await res.text();

      let data: { articles?: GdeltArticle[] };
      try {
        data = JSON.parse(text);
      } catch {
        console.error(
          `GDELT non-JSON response for query "${query}": ${text.slice(0, 200)}`
        );
        return null;
      }

      return { articles: data?.articles ?? [], queryTag: query };
    } catch (err) {
      console.error(`GDELT fetch failed for query "${query}":`, err);
      return null;
    }
  }

  return null;
}

export async function fetchGdeltCandidates():