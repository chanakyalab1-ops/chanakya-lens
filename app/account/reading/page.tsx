import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { supabaseServer } from '@/lib/supabase-server';
import { readingMap, type ReadStory, type Tally } from '@/lib/readStats';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your Reading Map | Chanakya Lens', robots: { index: false, follow: false } };

const DAYS = 30;
const since = () => new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
type Row = { slug: string; category: string; subject_countries: string[] | null };
const toStory = (r: Row): ReadStory => ({ category: r.category, subjectCountries: r.subject_countries ?? [] });

export default async function ReadingPage() {
  const user = await getSessionUser();
  if (!user) redirect('/account/login');
  if (!membershipVisibleTo(user.email)) notFound();

  const db = supabaseServer();
  const cutoff = since();
  const { data: reads } = await db.from('story_reads').select('slug').eq('user_id', user.id).gte('read_at', cutoff).limit(1000);
  const slugs = ((reads ?? []) as { slug: string }[]).map((r) => r.slug);
  const [readRows, recentRows] = await Promise.all([
    slugs.length ? db.from('stories').select('slug, category, subject_countries').in('slug', slugs) : Promise.resolve({ data: [] }),
    db.from('stories').select('slug, category, subject_countries').gte('created_at', cutoff).limit(500),
  ]);
  const map = readingMap(((readRows.data ?? []) as Row[]).map(toStory), ((recentRows.data ?? []) as Row[]).map(toStory));

  return (
    <>
      <NavDrawer />
      <div className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <Link href="/account" className="font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>
          ← Your account
        </Link>
        <h1 className="font-display text-3xl font-bold mt-4 mb-2">Your Reading Map</h1>
        <p className="text-[0.95rem] leading-relaxed mb-6" style={{ color: 'var(--text-body)' }}>
          What you read over the last {DAYS} days, and which countries were in the news that you never opened. Private to you.
        </p>
        {map.total === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>
            Nothing yet. Stories you open while signed in are counted here.
          </p>
        ) : (
          <>
            <p className="font-mono text-[0.7rem] uppercase tracking-widest mb-6" style={{ color: 'var(--brand-soft)' }}>{map.total} stories read</p>
            <Bars title="By topic" rows={map.categories} />
            <Bars title="Countries you read about" rows={map.countries} />
            <Bars title="In the news, not on your radar" rows={map.unseen} note="Stories about these countries ran in the last 30 days and you opened none." muted />
          </>
        )}
      </div>
    </>
  );
}

function Bars({ title, rows, note, muted }: { title: string; rows: Tally[]; note?: string; muted?: boolean }) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <section className="mb-7">
      <h2 className="font-mono text-[0.7rem] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-soft)' }}>{title}</h2>
      {note && <p className="text-[0.75rem] mb-3" style={{ color: 'var(--text-on-ink-dim)' }}>{note}</p>}
      <div className="space-y-2 mt-2">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3">
            <span className="font-mono text-[0.7rem] w-32 shrink-0 truncate">{r.name}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round((r.count / max) * 100)}%`, background: muted ? 'var(--developing)' : 'var(--brand-soft)' }} />
            </div>
            <span className="font-mono text-[0.65rem] w-6 text-right" style={{ color: 'var(--text-on-ink-dim)' }}>{r.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
