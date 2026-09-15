import { ImageResponse } from 'next/og';
import { getStoryBySlug } from '@/lib/stories';

export const runtime = 'edge';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return new Response('Not found', { status: 404 });

  const fontSize = story.headline.length > 100 ? 56 : story.headline.length > 60 ? 68 : 80;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(160deg, #0B1220 0%, #132340 60%, #0B1220 100%)', padding: '100px 80px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #C97B4A, #6FA98A)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 32, letterSpacing: 8, color: '#C97B4A', fontWeight: 800, textTransform: 'uppercase' }}>CHANAKYA LENS</div>
          {story.category && (
            <div style={{ fontSize: 24, color: '#6FA98A', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 600 }}>{story.category}</div>
          )}
        </div>
        <div style={{ fontSize: fontSize, fontWeight: 800, color: '#EDE7DA', lineHeight: 1.1, letterSpacing: -2 }}>{story.headline}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ width: 80, height: 3, background: '#C97B4A' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 28, color: '#8A93A6', letterSpacing: 1 }}>Stay ahead of the map.</div>
            <div style={{ fontSize: 24, color: '#4A5568', letterSpacing: 2 }}>chanakyalens.com</div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #6FA98A, #C97B4A)' }} />
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}