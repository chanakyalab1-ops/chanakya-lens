import type { GdeltArticle, GdeltFetchResult } from "./gdelt";
import { RSS_FEEDS, type RssFeed } from "./rssFeeds";
import { isOffTopic } from "./ingestFilters";

const REQUEST_TIMEOUT_MS = 8000;
const CONCURRENCY = 16;
const MAX_ITEMS_PER_FEED = 40;
const MAX_AGE_HOURS = 72;
// Some outlets 403 anything that does not look like a browser.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export type RssItem = { title: string; url: string; publishedAt: string | null };

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—",
};

function decode(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : null;
}

function stripTracking(url: string): string {
  try {
    const u = new URL(url);
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|ocid|cmpid|ref$|rss$)/i.test(key)) u.searchParams.delete(key);
    }
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

// Handles RSS 2.0, RSS 1.0 (RDF) and Atom -- the three shapes news feeds use.
export function parseFeed(xml: string): RssItem[] {
  const items: RssItem[] = [];
  for (const m of xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)) {
    const block = m[0];
    const title = tag(block, "title");
    if (!title) continue;

    let url = tag(block, "link");
    if (!url) {
      const atom =
        block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) ??
        block.match(/<link[^>]*href=["']([^"']+)["']/i);
      url = atom ? decode(atom[1]) : null;
    }
    if (!url) {
      const guid = tag(block, "guid") ?? tag(block, "id");
      if (guid && /^https?:\/\//i.test(guid)) url = guid;
    }
    if (!url || !/^https?:\/\//i.test(url)) continue;

    const dateRaw = tag(block, "pubDate") ?? tag(block, "dc:date") ?? tag(block, "published") ?? tag(block, "updated");
    const time = dateRaw ? new Date(dateRaw).getTime() : NaN;

    items.push({
      title,
      url: stripTracking(url),
      publishedAt: Number.isNaN(time) ? null : new Date(time).toISOString(),
    });
  }
  return items;
}

async function fetchFeed(feed: RssFeed): Promise<RssItem[]> {
  const res = await fetch(feed.url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "user-agent": USER_AGENT, accept: "application/rss+xml, application/xml, text/xml, */*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseFeed(await res.text());
}

export async function fetchRssCandidates(feeds: RssFeed[] = RSS_FEEDS): Promise<GdeltFetchResult> {
  const cutoff = Date.now() - MAX_AGE_HOURS * 3600 * 1000;
  const articles: Array<GdeltArticle & { queryTag: string }> = [];
  const seenUrls = new Set<string>();
  const failureDetails: string[] = [];
  let succeeded = 0;

  for (let i = 0; i < feeds.length; i += CONCURRENCY) {
    const batch = feeds.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(fetchFeed));
    settled.forEach((result, j) => {
      const feed = batch[j];
      if (result.status === "rejected") {
        const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        failureDetails.push(`${feed.domain} (${feed.url}): ${msg}`);
        return;
      }
      succeeded++;
      for (const item of result.value.slice(0, MAX_ITEMS_PER_FEED)) {
        if (item.publishedAt && new Date(item.publishedAt).getTime() < cutoff) continue;
        if (seenUrls.has(item.url) || isOffTopic(item.title)) continue;
        seenUrls.add(item.url);
        articles.push({
          url: item.url,
          title: item.title,
          domain: feed.domain,
          sourcecountry: feed.country,
          seendate: item.publishedAt ?? new Date().toISOString(),
          tone: 0,
          queryTag: "rss",
        });
      }
    });
  }

  return {
    articles,
    queriesAttempted: feeds.length,
    queriesSucceeded: succeeded,
    queriesFailed: feeds.length - succeeded,
    failureDetails,
  };
}
