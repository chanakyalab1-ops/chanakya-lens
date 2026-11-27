import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { dispatchAccess } from '@/lib/monthly';
import { listPosts, readMinutes } from '@/lib/analystDesk';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'The Analyst Desk | Chanakya Lens', description: 'In-depth analysis from our analysts, with the reasoning shown. Everyone can read the opening; Lens+ members get the whole piece.' };

export default async function AnalystDeskPage() {
  const user = await getSessionUser();
  if ((await dispatchAccess(user)) === 'hidden') notFound();
  const posts = await listPosts({ status: 'published' });
  posts.sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());

  return (
    <>
      <NavDrawer />
      <main className="max-w-3xl mx-auto px-5 pt-8 pb-20">
        <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-soft)' }}>Lens+</div>
        <h1 className="font-display font-extrabold text-4xl mb-2">The Analyst Desk</h1>
        <p className="text-[1rem] leading-relaxed mb-8" style={{ color: 'var(--text-body)' }}>
          Longer analysis from our analysts, with the reasoning shown. Everyone can read the opening; Lens+ members get the whole piece.
        </p>
        {posts.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>The first piece is on its way.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <Link key={p.id} href={`/analyst-desk/${p.slug}`} className="block rounded-sm border p-5 hover:opacity-90" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                <div className="font-mono text-[0.6875rem] uppercase tracking-wide mb-1.5" style={{ color: 'var(--brand-soft)' }}>
                  {p.authorName} · {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} · {readMinutes(p.body)} min read
                </div>
                <h2 className="font-display font-bold text-2xl leading-tight mb-1.5">{p.title}</h2>
                <p className="text-[0.92rem]" style={{ color: 'var(--text-body)' }}>{p.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
