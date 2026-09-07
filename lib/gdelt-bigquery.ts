// GDELT via Google BigQuery -- bypasses the DOC API entirely, avoiding
// whatever is blocking Vercel's outbound connections to api.gdeltproject.org.
// Docs: https://blog.gdeltproject.org/google-bigquery-gdelt-2-0/

import { BigQuery } from "@google-cloud/bigquery";
import type { GdeltArticle, GdeltFetchResult } from "./gdelt";

const QUERIES = [
  'tariff',
  "export controls sanctions",
  "border conflict skirmish",
  "joint military exercise naval drills arms sale defense pact",
];

function getBigQueryClient(): BigQuery {
  const rawCreds = process.env.GCP_BIGQUERY_CREDENTIALS_JSON;
  if (!rawCreds) {
    throw new Error("Missing GCP_BIGQUERY_CREDENTIALS_JSON env var.");
  }

  const credentials = JSON.parse(rawCreds);

  return new BigQuery({
    projectId: credentials.project_id,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });
}

// Runs one themed query against the last 24h of GDELT's GKG table.
// GKG rows include a DocumentIdentifier (the source URL) and V2Themes/V2Locations
// fields we can filter on with a simple LIKE, avoiding needing GDELT's own
// boolean query syntax.
async function fetchOneBigQueryTheme(bigquery: BigQuery, keyword: string): Promise<GdeltArticle[]> {
  const query = `
    SELECT
      DocumentIdentifier AS url,
      SourceCommonName AS domain,
      DATE AS seendate
    FROM \`gdelt-bq.gdeltv2.gkg_partitioned\`
    WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
      AND LOWER(V2Themes) LIKE LOWER(@keywordPattern)
      AND DocumentIdentifier LIKE 'http%'
    LIMIT 20
  `;

  const [rows] = await bigquery.query({
    query,
    params: { keywordPattern: `%${keyword.split(" ")[0]}%` },
  });

  return (rows as { url: string; domain: string; seendate: string }[]).map((row) => ({
    url: row.url,
    title: row.domain, // GKG doesn't include headline text directly; domain as placeholder
    domain: row.domain,
    sourcecountry: "",
    seendate: String(row.seendate),
    tone: 0,
  }));
}

export async function fetchGdeltCandidatesViaBigQuery(): Promise<GdeltFetchResult> {
  console.log(`[GDELT-BQ] fetchGdeltCandidatesViaBigQuery START ${new Date().toISOString()}`);

  const bigquery = getBigQueryClient();
  const articles: Array<GdeltArticle & { queryTag: string }> = [];
  let queriesSucceeded = 0;
  let queriesFailed = 0;
  const failureDetails: string[] = [];

  for (const keyword of QUERIES) {
    try {
      const results = await fetchOneBigQueryTheme(bigquery, keyword);
      queriesSucceeded++;
      for (const a of results) {
        articles.push({ ...a, queryTag: keyword });
      }
    } catch (err) {
      queriesFailed++;
      const message = err instanceof Error ? err.message : String(err);
      failureDetails.push(`"${keyword}": ${message}`);
      console.error(`[GDELT-BQ] Query failed for "${keyword}": ${message}`);
    }
  }

  console.log(`[GDELT-BQ] END -- succeeded: ${queriesSucceeded}, failed: ${queriesFailed}`);

  return {
    articles,
    queriesAttempted: QUERIES.length,
    queriesSucceeded,
    queriesFailed,
    failureDetails,
  };
}
