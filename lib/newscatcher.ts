// NewsCatcher News API -- replaces GDELT DOC API, which has been unreachable
// from Vercel's outbound network for 40+ hours.
// Docs: https://www.newscatcherapi.com/docs

import type { GdeltArticle, GdeltFetchResult } from "./gdelt";

const NEWSCATCHER_ENDPOINT = "https://v3-api.newscatcherapi.com/api/search";

const QUERIES = [
  "tariff",
  "sanctions export controls",
  "border conflict",
  "military exercise defense pact",
];

const REQUEST_TIMEOUT_MS = 15000;

type NewsCatcherArticle = {
  title: string;
  link: string;
  domain_url: string;
  country?: string;
  published_date: string;
};

type NewsCatcherCluster = {
  cluster_id: string;
  cluster_size: number;
  articles: NewsCatcherArticle[];
};

async function fetchOneQuery(query: string): Promise<GdeltArticle[]> {
  const apiKey = process.env.NEWSCATCHER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NEWSCATCHER_API_KEY env var.");
  }

  const params = new URLSearchParams({
    q: query,
    lang: "en",
    page_size: "20",
    exclude_duplicates: "true",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${NEWSCATCHER_ENDPOINT}?${params.toString()}`, {
      headers: { "x-api-token": apiKey },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`NewsCatcher HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const clusters: NewsCatcherCluster[] = data?.clusters ?? [];

    // Take just the top (most relevant) article from each cluster --
    // this is the free dedupe win: one story per real-world event,
    // not one per outlet covering the same event.
    return clusters
      .map((cluster) => cluster.articles?.[0])
      .filter((a): a is NewsCatcherArticle => !!a)
      .map((a) => ({
        url: a.link,
        title: a.title,
        domain: a.domain_url,
        sourcecountry: a.country ?? "",
        seendate: a.published_date,
        tone: 0,
      }));
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function fetchNewsCatcherCandidates(): Promise<GdeltFetchResult> {
  console.log(`[NewsCatcher] START ${new Date().toISOString()}`);

  const articles: Array<GdeltArticle & { queryTag: string }> = [];
  let queriesSucceeded = 0;
  let queriesFailed = 0;
  const failureDetails: string[] = [];

  for (const query of QUERIES) {
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
      console.error(`[NewsCatcher] Query failed for "${query}": ${message}`);
    }
  }

  console.log(`[NewsCatcher] END -- succeeded: ${queriesSucceeded}, failed: ${queriesFailed}, articles: ${articles.length}`);

  return {
    articles,
    queriesAttempted: QUERIES.length,
    queriesSucceeded,
    queriesFailed,
    failureDetails,
  };
}
