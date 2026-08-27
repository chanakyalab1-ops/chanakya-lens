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

const BASE_DELAY_MS = 6000;
const INITIAL_429_BACKOFF_MS = 20000;
const MAX_429_BACKOFF_MS = 60000;
const NETWORK_RETRY_BACKOFF_MS = 5000;
const MAX_RETRIES_PER_QUERY = 1;
const CONNECT_TIMEOUT_MS = 10000;

const GLOBAL_DEADLINE_MS = 90000;

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

    try {
      const res = await fetch(`${GDELT_ENDPOINT}?${params.toString()}`, {
        headers: { "User-Agent": "ChanakyaLens/1.0 (+https://chanakyalens.com)" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 429) {
        lastReason = "rate_limited_429";
        if (attempt < MAX_RETRIES_PER_QUERY) {
          const retryAfterHeader = res.headers.get("retry-after");
          let backoff: number;
          if (retryAfterHeader && Number.isFinite(Number(retryAfterHeader))) {
            backoff = Number(retryAfterHeader) * 1000;
          } else {
            const jitter = Math.floor(Math.random() * 2000);
            backoff = Math.min(INITIAL_429_BACKOFF_MS * Math.pow(2, attempt) + jitter, MAX_429_BACKOFF_MS);
          }
          console.warn(`GDELT 429 for query "${query}" -- backing off ${backoff}ms`);
          await sleep(backoff);
          continue;
        }
        console.error(`GDELT still 429 for query "${query}" after retries -- giving up`);
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
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === "AbortError";
      const message = err instanceof Error ? err.message : String(err);
      lastReason = isAbort ? "connect_timeout" : `network_error: ${message}`;
      console.error(`GDELT fetch failed for query "${query}": ${lastReason}`);

      if (attempt < MAX_RETRIES_PER_QUERY) {
        console.warn(`Backing off ${NETWORK_RETRY_BACKOFF_MS}ms before retry`);
        await sleep(NETWORK_RETRY_BACKOFF_MS);
        continue;
      }
      return { status: "failed", reason: lastReason };
    }
  }

  return { status: "failed", reason: lastReason };
}

export async function fetchGdeltCandidates(): Promise<GdeltFetchResult> {
  const runStart = Date.now();
  console.log(`[GDELT] fetchGdeltCandidates START ${new Date().toISOString()}`);

  const articles: Array<GdeltArticle & { queryTag: string }> = [];
  let queriesSucceeded = 0;
  let queriesFailed = 0;
  const failureDetails: string[] = [];
  let queriesSkippedForDeadline = 0;

  for (const query of QUERIES) {
    if (Date.now() - runStart > GLOBAL_DEADLINE_MS) {
      console.warn(`[GDELT] Global deadline (${GLOBAL_DEADLINE_MS}ms) reached -- skipping remaining queries`);
      queriesSkippedForDeadline++;
      failureDetails.push(`"${query}": skipped_global_deadline`);
      continue;
    }

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

    if (Date.now() - runStart < GLOBAL_DEADLINE_MS) {
      await sleep(BASE_DELAY_MS);
    }
  }

  console.log(
    `[GDELT] fetchGdeltCandidates END ${new Date().toISOString()} -- succeeded: ${queriesSucceeded}, failed: ${queriesFailed}, skipped_for_deadline: ${queriesSkippedForDeadline}, elapsed: ${Date.now() - runStart}ms`
  );

  return {
    articles,
    queriesAttempted: QUERIES.length,
    queriesSucceeded,
    queriesFailed,
    failureDetails,
  };
}
