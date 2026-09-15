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

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0B1220',
          padding: '80px 60px',
        }}
      >
        {/* Top — wordmark */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            fontSize: 28,
            letterSpacing: 6,
            color: '#C97B4A',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            CHANAKYA LENS
          </div>
          {story.category && (
            <div style={{
              fontSize: 22,
              color: '#8A93A6',
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}>
              {story.category}
            </div>
          )}
        </div>

        {/* Middle — headline */}
        <div style={{
          fontSize: story.headline.length > 80 ? 52 : 64,
          fontWeight: 800,
          color: '#EDE7DA',
          lineHeight: 1.15,
          letterSpacing: -1,
        }}>
          {story.headline}
        </div>

        {/* Bottom — tagline + accent dots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D9694A' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C9A84A' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6FA98A' }} />
          </div>
          <div style={{ fontSize: 26, color: '#8A93A6', letterSpacing: 1 }}>
            Stay ahead of the map. — chanakyalens.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    }
  );
}