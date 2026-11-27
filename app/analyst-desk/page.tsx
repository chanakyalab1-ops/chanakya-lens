import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import NavDrawer from '@/components/NavDrawer';
import { listPosts, readMinutes } from '@/lib/analystDesk';
import { getAllStories } from '@/lib/stories';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'The Analyst Desk | Chanakya Lens', description: 'In-depth analysis from our analysts on the stories we publish, with the reasoning shown.' };

export default async function AnalystDeskPage() {
  const [posts, stories] = await Promise.all([listPosts({ status: 'published' }), getAllStories()]);
  const headlines = new Map(stories.map((st) => [st.slug, st.headline]));
  posts.sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());

  return (
    <>
      <NavDrawer />
      <main className="max-w-3xl mx-auto px-5 pt-8 pb-20">
        <h1 className="mb-3">
          <span className="sr-only">The Analyst Desk</span>
          <Image src="/analyst-desk-logo.png" alt="" width={1162} height={270} unoptimized className="logo-for-light h-auto w-full max-w-[300px]" />
          <Image src="/analyst-desk-logo-dark.png" alt="" width={1162} height={270} unoptimized className="logo-for-dark h-auto w-full max-w-[300px]" />
        </h1>
        <p className="text-[1rem] leading-relaxed mb-8" style={{ color: 'var(--text-body)' }}>
          Longer analysis from our analysts on the stories we publish, with the reasoning shown. Free to read.
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
                {p.storySlug && headlines.get(p.storySlug) && <div className="text-xs mt-2" style={{ color: 'var(--text-on-ink-dim)' }}>On our story: {headlines.get(p.storySlug)}</div>}
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
