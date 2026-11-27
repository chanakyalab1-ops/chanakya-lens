import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { isOwnerEmail } from '@/lib/memberAccess';
import { getAllStories } from '@/lib/stories';
import { STATUS_LABEL, getAnalyst, listPosts, readMinutes, wordCount, writerStats } from '@/lib/analystDesk';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Writer dashboard | Chanakya Lens', robots: { index: false, follow: false } };

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function WriterDashboard() {
  const user = await getSessionUser();
  if (!user?.email) redirect('/account/login');
  const analyst = await getAnalyst(user.email);
  const owner = isOwnerEmail(user.email);
  if (!owner && !(analyst && analyst.active)) notFound();

  const [posts, allStories] = await Promise.all([listPosts({ authorEmail: user.email }), getAllStories()]);
  const headlines = new Map(allStories.map((st) => [st.slug, st.headline]));
  const stats = writerStats(posts);
  const changes = posts.filter((p) => p.status === 'changes');
  const name = analyst?.name?.split(' ')[0] ?? 'there';
  const card = (label: string, value: number | string, accent?: string) => (
    <div className="rounded-sm border p-4" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
      <div className="font-display font-extrabold text-3xl" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="font-mono text-[0.625rem] uppercase tracking-widest mt-1" style={{ color: 'var(--text-on-ink-dim)' }}>{label}</div>
    </div>
  );

  return (
    <>
      <NavDrawer />
      <main className="max-w-4xl mx-auto px-5 pt-8 pb-20">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-soft)' }}>The Analyst Desk</div>
            <h1 className="font-display font-extrabold text-4xl">Hi {name}</h1>
            <p className="text-[0.95rem] mt-1" style={{ color: 'var(--text-body)' }}>Your analysis of our stories, in one place. Pick a story, write, save drafts, send a piece to the editor when it is ready, and see what comes back.</p>
          </div>
          <Link href="/writer/new" className="px-5 py-3 text-sm font-semibold rounded-sm text-white" style={{ background: '#0E7080' }}>New write-up</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {card('Drafts', stats.drafts)}
          {card('With the editor', stats.withEditor)}
          {card('Changes requested', stats.changes, stats.changes ? 'var(--developing)' : undefined)}
          {card('Published', stats.published, 'var(--possible)')}
          {card('Words written', stats.words.toLocaleString('en-GB'))}
        </div>

        {changes.length > 0 && (
          <section className="mb-8">
            <h2 className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: 'var(--developing)' }}>Needs your changes</h2>
            <div className="space-y-3">
              {changes.map((p) => (
                <Link key={p.id} href={`/writer/${p.id}`} className="block rounded-sm border-l-4 border p-4 hover:opacity-90" style={{ borderColor: 'var(--border)', borderLeftColor: 'var(--developing)', background: 'var(--ink-card)' }}>
                  <div className="font-semibold">{p.title || 'Untitled'}</div>
                  <p className="text-[0.88rem] mt-1" style={{ color: 'var(--text-body)' }}>{p.editorNote}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-soft)' }}>All your pieces</h2>
          {posts.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>Nothing yet. Start with New write-up.</p>
          ) : (
            <ul className="space-y-2">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/writer/${p.id}`} className="flex items-center justify-between gap-3 rounded-sm border p-4 hover:opacity-90" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{p.title || 'Untitled'}</div>
                      {p.storySlug && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--brand-soft)' }}>On: {headlines.get(p.storySlug) ?? p.storySlug}</div>}
                      <div className="text-xs mt-1" style={{ color: 'var(--text-on-ink-dim)' }}>
                        {wordCount(p.body).toLocaleString('en-GB')} words · {readMinutes(p.body)} min read · updated {fmt(p.updatedAt)}
                      </div>
                    </div>
                    <span className="font-mono text-[0.6875rem] uppercase shrink-0" style={{ color: p.status === 'published' ? 'var(--possible)' : p.status === 'changes' ? 'var(--developing)' : 'var(--text-on-ink-dim)' }}>{STATUS_LABEL[p.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
