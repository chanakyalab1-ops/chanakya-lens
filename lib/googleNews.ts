// Google News RSS search -- free and keyless, returns up to ~100 articles from
// many outlets for a query, with the publisher's domain in <source url=...>.
// Unofficial: no uptime or quota guarantee, so callers must treat failures as
// "no results". Links are news.google.com redirects that open the article.

export type NewsHit = {
  title: string;
  url: string;
  domain: string;
  outlet: string;
  publishedAt: string | null;
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseGoogleNews(xml: string): NewsHit[] {
  const hits: NewsHit[] = [];
  for (const m of xml.matchAll(/<item>[\s\S]*?<\/item>/gi)) {
    const block = m[0];
    const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
    const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1];
    const source = block.match(/<source[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/source>/i);
    if (!rawTitle || !link || !source) continue;

    const outlet = decode(source[2]);
    let title = decode(rawTitle);
    // Google appends " - Outlet" to every headline.
    if (outlet && title.endsWith(` - ${outlet}`)) title = title.slice(0, -(outlet.length + 3));

    const domain = source[1].replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
    const dateRaw = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1];
    const time = dateRaw ? new Date(decode(dateRaw)).getTime() : NaN;

    hits.push({
      title,
      url: decode(link),
      domain,
      outlet,
      publishedAt: Number.isNaN(time) ? null : new Date(time).toISOString(),
    });
  }
  return hits;
}

export async function searchGoogleNews(query: string): Promise<NewsHit[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; ChanakyaLensBot/1.0)" },
    });
    if (!res.ok) return [];
    return parseGoogleNews(await res.text());
  } catch {
    return [];
  }
}
