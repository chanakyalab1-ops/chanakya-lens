// TheNewsAPI -- replaces NewsCatcher (trial expired).
// Docs: https://www.thenewsapi.com/documentation

import type { GdeltArticle, GdeltFetchResult } from "./gdelt";

const THENEWSAPI_ENDPOINT = "https://api.thenewsapi.com/v1/news/all";

const QUERIES = [
  "tariff",
  "sanctions export controls",
  "border conflict",
  "military exercise defense pact",
];

const REQUEST_TIMEOUT_MS = 15000;
const DELAY_BETWEEN_QUERIES_MS = 2000;
const MAX_ARTICLES_PER_QUERY = 10;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type TheNewsApiArticle = {
  title?: string;
  url?: string;
  source?: string;
  language?: string;
  published_at?: string;
};

async function fetchOneQuery(query: string): Promise<GdeltArticle[]> {
  const apiKey = process.env.THENEWSAPI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing THENEWSAPI_API_KEY env var.");
  }

  const publishedAfter = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD

  const params = new URLSearchParams({
    api_token: apiKey,
    search: query,
    language: "en",
    published_after: publishedAfter,
    limit: String(MAX_ARTICLES_PER_QUERY),
    sort: "published_at",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${THENEWSAPI_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TheNewsAPI HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const articles: TheNewsApiArticle[] = data?.data ?? [];

    console.log(`[TheNewsAPI] "${query}" -- ${articles.length} articles returned`);

    const results: GdeltArticle[] = [];
    for (const a of articles) {
      if (!a.url || !a.title) continue;
      results.push({
        url: a.url,
        title: a.title,
        domain: a.source ?? "",
        sourcecountry: "",
        seendate: a.published_at ?? "",
        tone: 0,
      });
    }

    return results;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function fetchTheNewsApiCandidates(): Promise<GdeltFetchResult> {
  console.log(`[TheNewsAPI] START ${new Date().toISOString()}`);

  const articles: Array<GdeltArticle & { queryTag: string }> = [];
  let queriesSucceeded = 0;
  let queriesFailed = 0;
  const failureDetails: string[] = [];

  for (let i = 0; i < QUERIES.length; i++) {
    const query = QUERIES[i];

    try {
      const results = await fetchOneQuery(query);
      queriesSucceeded++;
      for (const a of results) {
        articles.push({ ...a, queryTag: query });
      }
    } catch (err) {
      queriesFailed++;
      const message = err instanceof Error ? err.message : String(err);
      failureDetails.push(`"${query}": ${message}`);
      console.error(`[TheNewsAPI] Query failed for "${query}": ${message}`);
    }

    if (i < QUERIES.length - 1) {
      await sleep(DELAY_BETWEEN_QUERIES_MS);
    }
  }

  console.log(`[TheNewsAPI] END -- succeeded: ${queriesSucceeded}, failed: ${queriesFailed}, articles: ${articles.length}`);

  return {
    articles,
    queriesAttempted: QUERIES.length,
    queriesSucceeded,
    queriesFailed,
    failureDetails,
  };
}
