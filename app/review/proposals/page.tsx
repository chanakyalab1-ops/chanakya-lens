import Link from 'next/link';
import { proposeStories } from '@/lib/auto-generate';
import { supabaseServer } from '@/lib/supabase-server';
import { getBacklog, readBufferSettings, unreviewed } from '@/lib/pipelineBuffer';
import { ProposalList } from './ProposalList';

export const dynamic = 'force-dynamic';
// Clustering ~1000 articles takes a couple of seconds.
export const maxDuration = 60;

export default async function ProposalsPage() {
  const settings = readBufferSettings();
  const [proposals, backlog] = await Promise.all([proposeStories(20), getBacklog(supabaseServer())]);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="font-display text-3xl font-extrabold">Proposed stories</h1>
        <Link href="/admin" className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>
          ← Admin
        </Link>
      </div>
      <p className="text-[0.85rem] mb-1 max-w-2xl" style={{ color: 'var(--text-body)' }}>
        The best-covered stories right now, ranked by how many outlets and countries ran them. Nothing is generated,
        and nothing spent, until you approve it.
      </p>
      <p className="font-mono text-[0.68rem] mb-6" style={{ color: 'var(--text-on-ink-dim)' }}>
        {backlog.inReview} waiting for review · {unreviewed(backlog)} unreviewed in total · {backlog.generated24h} generated in the last 24h
        {settings.mode === 'auto' ? ' · AUTOMATIC mode is on: stories are also generated without approval' : ''}
      </p>
      <ProposalList proposals={proposals} />
    </div>
  );
}
