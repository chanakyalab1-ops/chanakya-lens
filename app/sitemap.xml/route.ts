import { getAllStories, getSitemapEntries } from '@/lib/stories';
import { listPosts } from '@/lib/analystDesk';
import { ALL_ENTITIES, isThinCountry, storiesFor } from '@/lib/lens';

// 12 hours; refreshed on publish (lib/siteRefresh.ts).
export const revalidate = 43200;

export async function GET() {
  const [stories, entries, analysis] = await Promise.all([getAllStories(), getSitemapEntries(), listPosts({ status: 'published' })]);

  const urls = entries.map((s) => `
    <url>
      <loc>https://chanakyalens.com/story/${s.slug}</loc>
      <lastmod>${new Date(s.publishedAt).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`).join('');

  const lensUrls = ALL_ENTITIES.filter((e) => !isThinCountry(e, storiesFor(e, stories).length)).map((e) => `
    <url>
      <loc>https://chanakyalens.com/lens/${e.slug}</loc>
      <changefreq>daily</changefreq>
      <priority>${e.kind === 'country' ? '0.5' : '0.6'}</priority>
    </url>`).join('');

  const analysisUrls = analysis.map((p) => `
    <url>
      <loc>https://chanakyalens.com/analyst-desk/${p.slug}</loc>
      <lastmod>${new Date(p.publishedAt ?? p.updatedAt).toISOString()}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://chanakyalens.com</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/analyst-desk</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/off-lens</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/regions</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/lens</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/today</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/how-we-rate</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/start-here</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/creators</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/membership</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/refund</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/whats-new</loc>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://chanakyalens.com/digest</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>${lensUrls}${urls}${analysisUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}