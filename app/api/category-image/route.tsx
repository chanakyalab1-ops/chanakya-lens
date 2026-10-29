import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Branded stand-in picture for a story when no suitable photo was found, so
// every story card has an image. One per category; cached for a year.
export async function GET(req: Request) {
  const category = (new URL(req.url).searchParams.get('category') ?? 'World').slice(0, 40);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, #0B1220 0%, #132340 60%, #0B1220 100%)', padding: '56px 64px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #C97B4A, #6FA98A)' }} />
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 8, color: '#C97B4A', fontWeight: 800 }}>CHANAKYA LENS</div>
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, color: '#EDE7DA', letterSpacing: -2 }}>{category}</div>
        <div style={{ display: 'flex', fontSize: 26, color: '#8A93A6', letterSpacing: 2 }}>Geopolitics traced to you</div>
      </div>
    ),
    { width: 1200, height: 675, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable' } }
  );
}
