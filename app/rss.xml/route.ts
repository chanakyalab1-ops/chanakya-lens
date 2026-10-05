import { getAllStories } from '@/lib/stories';

export const revalidate = 600;

const SITE = 'https://chanakyalens.com';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export async function GET() {
  const stories = (await getAllStories())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 50);

  const items = stories.map((s) => {
    const url = `${SITE}/story/${s.slug}`;
    return `
    <item>
      <title>${esc(s.headline)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(s.publishedAt).toUTCString()}</pubDate>
      <category>${esc(s.category)}</category>
      <description>${esc(s.dek ?? '')}</description>
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Chanakya Lens</title>
    <link>${SITE}</link>
    <description>Geopolitics traced to you. Small events, real chains, plausible impact -- not forecasts.</description>
    <language>en</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
