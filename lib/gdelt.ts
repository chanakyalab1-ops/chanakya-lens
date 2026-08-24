// GDELT DOC 2.0 API client -- free, no key required.
// Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

export type GdeltArticle = {
  url: string;
  title: string;
  domain: string;
  sourcecountry: string;
  seendate: string;
  tone: number;
};

export type GdeltFetchResult = {
  articles: Array<GdeltArticle & { queryTag: string }>;
  queriesAttempted: number;
  queriesSucceeded: number;
  queriesFailed: number;
  failureDetails: string[];
};

const QUERIES = [
  'tariff (import OR bilateral OR retaliation) -"sales tax" -"property tax"',
  "export controls sanctions",
  "border (conflict OR skirmish)",
  '("joint military exercise" OR "naval drills" OR "arms sale" OR "defense pact" OR "bilateral security")',
];

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";

// GDELT needs roughly 5-6s minimum between requests -- 3s was too aggressive
const BASE_DELAY_MS = 6000;
const INITIAL_429_BACKOFF_MS = 20000;
const MAX_429_BACKOFF_MS = 5 * 60000;
const NETWORK_RETRY_BACKOFF_MS = 4000;
const MAX_RETRIES_PER_QUERY = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type QueryOutcome =
  | { status: "success"; articles: GdeltArticle[] }
  | { status: "failed"; reason: string };

async function fetchOneQuery(query: string): Promise<QueryOutcome> {
  const params = new URLSearchParams({
    query: `${query} sourcelang:eng`,
    mode: "artlist",
    format: "json",
    maxrecords: "20",
    timespan: "24h",
    sort: "datedesc",
  });

  let lastReason = "unknown error";

  for (let attempt = 0; attempt <= MAX_RETRIES_PER_QUERY; attempt++) {
    try {
      const res = await fetch(`${GDELT_ENDPOINT}?${params.toString()}`, {
        headers: { "User-Agent": "ChanakyaLens/1.0 (+https://chanakyalens.com)" },
      });

      if (res.status === 429) {
        lastReason = "rate_limited_429";

        if (attempt < MAX_RETRIES_PER_QUERY) {
          const retryAfterHeader = res.headers.get("retry-after");
          let backoff: number;

          if (retryAfterHeader && Number.isFinite(Number(retryAfterHeader))) {
            backoff = Number(retryAfterHeader) * 1000;
          } else {
            const jitter = Math.floor(Math.random() * 3000);
            backoff = Math.min(
              INITIAL_429_BACKOFF_MS * Math.pow(2, attempt) + jitter,
              MAX_429_BACKOFF_MS
            );
          }

          console.warn(
            `GDELT 429 for query "${query}" -- attempt ${attempt + 1}/${MAX_RETRIES_PER_QUERY}, backing off ${backoff}ms`
          );
          await sleep(backoff);
          continue;
        }

        console.error(`GDELT still 429 for query "${query}" after ${MAX_RETRIES_PER_QUERY} retries -- giving up`);
        return { status: "failed", reason: lastReason };
      }

      if (!res.ok) {
        console.error(`GDELT HTTP ${res.status} for query "${query}"`);
        return { status: "failed", reason: `http_${res.status}` };
      }

      const text = await res.text();
      let data: { articles?: GdeltArticle[] };
      try {
        data = JSON.parse(text);
      } catch {
        console.error(`GDELT non-JSON response for query "${query}": ${text.slice(0, 200)}`);
        return { status: "failed", reason: "non_json_response" };
      }

      return { status: "success", articles: data?.articles ?? [] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastReason = `network_error: ${message}`;
      console.error(`GDELT fetch failed for query "${query}":`, err);

      if (attempt < MAX_RETRIES_PER_QUERY) {
        const backoff = NETWORK_RETRY_BACKOFF_MS * (attempt + 1);
        console.warn(`Network error -- backing off ${backoff}ms before retry`);
        await sleep(backoff);
        continue;
      }
      return { status: "failed", reason: lastReason };
    }
  }

  return { status: "failed", reason: lastReason };
}

export async function fetchGdeltCandidates(): Promise<GdeltFetchResult> {
  console.log(`[GDELT] fetchGdeltCandidates START ${new Date().toISOString()}`);

  const articles: Array<GdeltArticle & { queryTag: string }> = [];
  let queriesSucceeded = 0;
  let queriesFailed = 0;
  const failureDetails: string[] = [];

  for (const query of QUERIES) {
    const outcome = await fetchOneQuery(query);

    if (outcome.status === "success") {
      queriesSucceeded++;
      for (const a of outcome.articles) {
        articles.push({ ...a, queryTag: query });
      }
    } else {
      queriesFailed++;
      failureDetails.push(`"${query}": ${outcome.reason}`);
    }

    await sleep(BASE_DELAY_MS);
  }

  console.log(`[GDELT] fetchGdeltCandidates END ${new Date().toISOString()} -- succeeded: ${queriesSucceeded}, failed: ${queriesFailed}`);

  return {
    articles,
    queriesAttempted: QUERIES.length,
    queriesSucceeded,
    queriesFailed,
    failureDetails,
  };
}
