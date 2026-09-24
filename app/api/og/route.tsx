import { ImageResponse } from 'next/og';
import { getStoryBySlug } from '@/lib/stories';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const story = slug ? await getStoryBySlug(slug) : null;

  if (!story) {
    return new Response('Not found', { status: 404 });
  }

  const fontSize = story.headline.length > 100 ? 42 : story.headline.length > 60 ? 52 : 64;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0B1220 0%, #132340 60%, #0B1220 100%)',
          padding: '56px 64px',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #C97B4A, #6FA98A)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: '#C97B4A', fontWeight: 800, textTransform: 'uppercase' }}>CHANAKYA LENS</div>
          {story.category && (
            <div style={{ fontSize: 18, color: '#6FA98A', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600 }}>{story.category}</div>
          )}
        </div>
        <div style={{ display: 'flex', fontSize, fontWeight: 800, color: '#EDE7DA', lineHeight: 1.15, letterSpacing: -1.5, maxWidth: 980 }}>
          {story.headline}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ width: 64, height: 3, background: '#C97B4A' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 20, color: '#8A93A6', letterSpacing: 1 }}>Stay ahead of the map.</div>
            <div style={{ fontSize: 18, color: '#4A5568', letterSpacing: 2 }}>chanakyalens.com</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
