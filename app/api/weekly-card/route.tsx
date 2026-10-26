import { ImageResponse } from 'next/og';
import { getWeeklyItems } from '@/lib/stories';
import { clip, pickWeekly } from '@/lib/weeklyCard';

export const runtime = 'edge';

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// A 1080x1920 recap of the week's top stories for Instagram/WhatsApp stories.
// ?n=3..6 sets how many stories to show (default 5).
export async function GET(req: Request) {
  const n = Math.min(6, Math.max(3, Number(new URL(req.url).searchParams.get('n')) || 5));
  const items = pickWeekly(await getWeeklyItems(7), n);
  if (items.length === 0) return new Response('No stories this week', { status: 404 });

  const end = new Date();
  const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, #0B1220 0%, #132340 60%, #0B1220 100%)', padding: '90px 70px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #C97B4A, #6FA98A)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', fontSize: 32, letterSpacing: 8, color: '#C97B4A', fontWeight: 800 }}>CHANAKYA LENS</div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#EDE7DA', letterSpacing: -2 }}>The Week in 60 Seconds</div>
          <div style={{ display: 'flex', fontSize: 26, color: '#8A93A6', letterSpacing: 2 }}>{`${fmt(start)} – ${fmt(end)}`}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: 46, marginTop: 40 }}>
          {items.map((s, i) => (
            <div key={s.slug} style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', fontSize: 60, fontWeight: 800, color: '#C97B4A', width: 80 }}>{i + 1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {s.category && <div style={{ display: 'flex', fontSize: 24, color: '#6FA98A', letterSpacing: 4, fontWeight: 600, textTransform: 'uppercase' }}>{s.category}</div>}
                <div style={{ display: 'flex', fontSize: 46, fontWeight: 700, color: '#EDE7DA', lineHeight: 1.18 }}>{clip(s.headline, 88)}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ width: 80, height: 3, background: '#C97B4A' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', fontSize: 28, color: '#8A93A6' }}>Daily digest in your inbox</div>
            <div style={{ display: 'flex', fontSize: 26, color: '#EDE7DA', letterSpacing: 2 }}>chanakyalens.com</div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #6FA98A, #C97B4A)' }} />
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=3600' },
    }
  );
}
