import { getAllStories } from '@/lib/stories';

export const revalidate = 600;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Google News sitemap: only stories from the last 48 hours are eligible.
export async function GET() {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = (await getAllStories())
    .filter((s) => new Date(s.publishedAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 1000);

  const urls = recent.map((s) => `
  <url>
    <loc>https://chanakyalens.com/story/${s.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Chanakya Lens</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(s.publishedAt).toISOString()}</news:publication_date>
      <news:title>${esc(s.headline)}</news:title>
    </news:news>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
