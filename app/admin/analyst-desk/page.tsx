import Link from 'next/link';
import { listAnalysts, listPosts } from '@/lib/analystDesk';
import { AnalystAdmin } from './AnalystAdmin';

export const dynamic = 'force-dynamic';

export default async function AnalystDeskAdminPage() {
  const [analysts, posts] = await Promise.all([listAnalysts(), listPosts()]);
  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: 'var(--text-on-ink)' }}>The Analyst Desk</h1>
        <Link href="/admin" className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>← Admin</Link>
      </div>
      <p className="text-[0.85rem] mb-6" style={{ color: 'var(--text-body)' }}>
        Add your writers, review what they send, and publish. Writers use chanakyalens.com/writer, which is their own dashboard. Published pieces stay hidden from readers until membership is public, like Lens Monthly.
      </p>
      <AnalystAdmin analysts={analysts} posts={posts} />
    </div>
  );
}
