import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { isOwnerEmail } from '@/lib/memberAccess';
import { canWriterEdit, getAnalyst, getPostById } from '@/lib/analystDesk';
import { getAllStories } from '@/lib/stories';
import { PostEditor } from '../PostEditor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Write | Chanakya Lens', robots: { index: false, follow: false } };

export default async function WriterEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ story?: string }> }) {
  const { id } = await params;
  const { story } = await searchParams;
  const user = await getSessionUser();
  if (!user?.email) redirect('/account/login');
  const owner = isOwnerEmail(user.email);
  const analyst = await getAnalyst(user.email);
  if (!owner && !(analyst && analyst.active)) notFound();

  const post = id === 'new' ? null : await getPostById(id);
  if (id !== 'new' && !post) notFound();
  if (post && !owner && post.authorEmail !== user.email.toLowerCase()) notFound();
  const stories = (await getAllStories()).slice(0, 250).map((s) => ({ slug: s.slug, headline: s.headline }));
  const locked = !!post && !owner && !canWriterEdit(post.status);

  return (
    <>
      <NavDrawer />
      <main className="max-w-3xl mx-auto px-5 pt-8 pb-20">
        <Link href={owner && post && post.authorEmail !== user.email.toLowerCase() ? '/admin/analyst-desk' : '/writer'} className="font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>← Back</Link>
        <h1 className="font-display font-extrabold text-3xl mt-4 mb-5">{post ? 'Edit write-up' : 'New write-up'}</h1>
        <PostEditor
          initial={post ? { id: post.id, storySlug: post.storySlug, title: post.title, summary: post.summary, body: post.body, heroUrl: post.heroUrl, tags: post.tags.join(', '), status: post.status, editorNote: post.editorNote, slug: post.slug } : null}
          locked={locked}
          isOwner={owner}
          stories={stories}
          presetStory={story ?? ''}
        />
      </main>
    </>
  );
}
