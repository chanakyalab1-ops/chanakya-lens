import { getAllStories } from '@/lib/stories';

export async function GET() {
  const stories = await getAllStories();
  
  const urls = stories.map((s) => `
    <url>
      <loc>https://chanakyalens.com/story/${s.slug}</loc>
      <lastmod>${new Date(s.publishedAt).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
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
  </url>${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}