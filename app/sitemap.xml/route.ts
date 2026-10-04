import { getAllStories } from '@/lib/stories';
import { ALL_ENTITIES } from '@/lib/lens';

export async function GET() {
  const stories = await getAllStories();
  
  const urls = stories.map((s) => `
    <url>
      <loc>https://chanakyalens.com/story/${s.slug}</loc>
      <lastmod>${new Date(s.publishedAt).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`).join('');

  const lensUrls = ALL_ENTITIES.map((e) => `
    <url>
      <loc>https://chanakyalens.com/lens/${e.slug}</loc>
      <changefreq>daily</changefreq>
      <priority>${e.kind === 'country' ? '0.5' : '0.6'}</priority>
    </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://chanakyalens.com</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
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
  </url>${lensUrls}${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}