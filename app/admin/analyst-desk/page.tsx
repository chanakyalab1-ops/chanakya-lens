import Link from 'next/link';
import { listAnalysts, listPosts } from '@/lib/analystDesk';
import { getAllStories } from '@/lib/stories';
import { AnalystAdmin } from './AnalystAdmin';

export const dynamic = 'force-dynamic';

export default async function AnalystDeskAdminPage() {
  const [analysts, posts, stories] = await Promise.all([listAnalysts(), listPosts(), getAllStories()]);
  const headlines = Object.fromEntries(stories.map((st) => [st.slug, st.headline]));
  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: 'var(--text-on-ink)' }}>The Analyst Desk</h1>
        <Link href="/admin" className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>← Admin</Link>
      </div>
      <p className="text-[0.85rem] mb-6" style={{ color: 'var(--text-body)' }}>
        Add your writers. They publish their own analysis of our stories, and it goes live straight away, free to read, on that story&apos;s page and in The Analyst Desk. You read it afterwards and can ask for changes, which takes it down until she fixes it. You get an alert whenever something is published. Writers use chanakyalens.com/writer, which is their own dashboard.
      </p>
      <AnalystAdmin analysts={analysts} posts={posts} headlines={headlines} />
    </div>
  );
}
