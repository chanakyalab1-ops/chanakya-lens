import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { DispatchBody } from '@/components/DispatchBody';
import { getSessionUser } from '@/lib/supabase-user';
import { isOwnerEmail } from '@/lib/memberAccess';
import { getAnalyst, getPostBySlug, readMinutes } from '@/lib/analystDesk';
import { parseBlocks } from '@/lib/miniMarkdown';
import { getLensEntity } from '@/lib/lens';
import { getAllStories } from '@/lib/stories';
import { slugifyPost } from '@/lib/analystDesk';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  return p ? { title: `${p.title} | The Analyst Desk | Chanakya Lens`, description: p.summary } : {};
}

export default async function AnalystPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  // The owner can open an unpublished piece to check it before publishing.
  const post = await getPostBySlug(slug, { includeUnpublished: isOwnerEmail(user?.email) });
  if (!post) notFound();
  const author = await getAnalyst(post.authorEmail);
  const story = post.storySlug ? (await getAllStories()).find((st) => st.slug === post.storySlug) : undefined;
  const blocks = parseBlocks(post.body);

  return (
    <>
      <NavDrawer />
      <main className="max-w-2xl mx-auto px-5 pt-8 pb-20">
        <Link href="/analyst-desk" className="font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>← The Analyst Desk</Link>
        {post.status !== 'published' && (
          <div className="mt-4 rounded-sm border p-3 text-xs" style={{ borderColor: 'var(--developing)', color: 'var(--developing)' }}>Preview. This piece is not published yet.</div>
        )}
        <div className="font-mono text-[0.6875rem] uppercase tracking-wide mt-5 mb-2" style={{ color: 'var(--brand-soft)' }}>
          {post.authorName}{post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''} · {readMinutes(post.body)} min read
        </div>
        <h1 className="font-display font-extrabold text-4xl leading-tight mb-3">{post.title}</h1>
        <p className="text-[1.05rem] leading-relaxed mb-5" style={{ color: 'var(--text-body)' }}>{post.summary}</p>
        {story && (
          <Link href={`/story/${story.slug}`} className="block rounded-sm border p-3 mb-5 hover:opacity-90" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
            <div className="font-mono text-[0.625rem] uppercase tracking-widest mb-1" style={{ color: 'var(--text-on-ink-dim)' }}>Analysis of our story</div>
            <div className="font-display font-bold text-[1.05rem] leading-tight">{story.headline}</div>
          </Link>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((t) => {
              const e = getLensEntity(slugifyPost(t));
              const cls = 'font-mono text-[0.6875rem] uppercase tracking-wide rounded-full border px-3 py-1';
              return e ? (
                <Link key={t} href={`/lens/${e.slug}`} className={`${cls} hover:opacity-80`} style={{ borderColor: 'var(--border)' }}>{t}</Link>
              ) : (
                <span key={t} className={cls} style={{ borderColor: 'var(--border)', color: 'var(--text-on-ink-dim)' }}>{t}</span>
              );
            })}
          </div>
        )}
        {post.heroUrl && /^https:\/\//.test(post.heroUrl) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.heroUrl} alt="" className="w-full rounded-sm border mb-8" style={{ borderColor: 'var(--border)' }} />
        )}
        <DispatchBody blocks={blocks} />
        {author?.bio && (
          <div className="mt-12 pt-6 border-t text-[0.88rem]" style={{ borderColor: 'var(--border)', color: 'var(--text-body)' }}>
            <span className="font-semibold">{author.name}.</span> {author.bio}
          </div>
        )}
      </main>
    </>
  );
}
