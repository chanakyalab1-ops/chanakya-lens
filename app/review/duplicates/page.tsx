import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { findSimilarPairs } from '@/lib/duplicates';
import { GroupButton } from './GroupButton';

export const dynamic = 'force-dynamic';

// Published stories from the last two weeks that look like repeats of each
// other. To remove one, unpublish it from Manage stories.
const WINDOW_DAYS = 14;

type Row = { slug: string; headline: string; created_at: string; sources: { url?: string | null; title?: string | null }[] | null };

const windowStart = () => new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

export default async function DuplicatesPage() {
  const since = windowStart();
  const { data } = await supabaseServer()
    .from('stories')
    .select('slug, headline, sources, created_at, thread_slug')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(300);

  const rows = (data ?? []) as (Row & { thread_slug?: string | null })[];
  const born = new Map(rows.map((r) => [r.slug, r.created_at]));
  const filed = new Map(rows.map((r) => [r.slug, r.thread_slug ?? null]));
  const stories = rows.map((s) => ({
    slug: s.slug,
    headline: s.headline,
    titles: [s.headline, ...(s.sources ?? []).map((x) => x.title ?? '').filter(Boolean)],
    urls: (s.sources ?? []).map((x) => x.url ?? '').filter(Boolean),
  }));
  const pairs = findSimilarPairs(stories).slice(0, 60);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="font-display text-3xl font-extrabold">Possible duplicates</h1>
        <Link href="/admin" className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>
          ← Admin
        </Link>
      </div>
      <p className="text-[0.85rem] mb-5 max-w-2xl" style={{ color: 'var(--text-body)' }}>
        Published stories from the last {WINDOW_DAYS} days that share articles or most of their wording with another one.
        Some are real developments on a running story, so check before removing anything. Unpublish from{' '}
        <Link href="/review/manage" className="underline">Manage stories</Link>.
      </p>
      {pairs.length === 0 ? (
        <p className="text-[0.9rem]" style={{ color: 'var(--text-body)' }}>No likely duplicates found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {pairs.map((p) => (
            <div key={`${p.a.slug}|${p.b.slug}`} className="rounded-sm border p-4" style={{ background: 'var(--ink-card)', borderColor: 'var(--border)' }}>
              <div className="font-mono text-[0.64rem] uppercase tracking-wide mb-2" style={{ color: 'var(--text-on-ink-dim)' }}>
                {p.reason === 'shared_article' ? 'Uses the same article' : 'Similar wording'} · match {Math.round(p.score * 100)}%
              </div>
              {[p.a, p.b].map((s) => (
                <Link key={s.slug} href={`/story/${s.slug}`} className="block text-[0.9rem] leading-snug py-1 hover:opacity-80" style={{ color: 'var(--text-on-ink)' }}>
                  {s.headline}
                </Link>
              ))}
              {(() => {
                const [older, newer] = (born.get(p.a.slug) ?? '') <= (born.get(p.b.slug) ?? '') ? [p.a, p.b] : [p.b, p.a];
                const already = filed.get(newer.slug) === older.slug || (filed.get(newer.slug) && filed.get(newer.slug) === filed.get(older.slug));
                return already ? (
                  <div className="mt-2 text-[0.75rem]" style={{ color: 'var(--text-on-ink-dim)' }}>Already grouped in one timeline.</div>
                ) : (
                  <GroupButton newerSlug={newer.slug} olderSlug={older.slug} />
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
