import Link from 'next/link';
import { proposeStories } from '@/lib/auto-generate';
import { supabaseServer } from '@/lib/supabase-server';
import { getBacklog, readBufferSettings, unreviewed } from '@/lib/pipelineBuffer';
import { ProposalList } from './ProposalList';
import { guessCategory } from '@/lib/categoryGuess';

export const dynamic = 'force-dynamic';
// Clustering ~1000 articles takes a couple of seconds.
export const maxDuration = 60;

// Stories published in the last 7 days per category, so gaps are easy to see.
async function publishedThisWeek(): Promise<Record<string, number>> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseServer().from('stories').select('category').gte('created_at', since).limit(1000);
  const out: Record<string, number> = {};
  for (const r of (data ?? []) as { category: string | null }[]) if (r.category) out[r.category] = (out[r.category] ?? 0) + 1;
  return out;
}

export default async function ProposalsPage() {
  const settings = readBufferSettings();
  const [proposals, backlog, weekly] = await Promise.all([proposeStories(40), getBacklog(supabaseServer()), publishedThisWeek()]);
  const categories = Object.fromEntries(proposals.map((p) => [p.id, guessCategory(p.headline)]));

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="font-display text-3xl font-extrabold">Proposed stories</h1>
        <Link href="/admin" className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>
          ← Admin
        </Link>
      </div>
      <p className="text-[0.85rem] mb-1 max-w-2xl" style={{ color: 'var(--text-body)' }}>
        The best-covered stories right now, ranked by how many outlets and countries ran them, sorted into rough
        categories so you can balance the site. Pick a category, tick what you want, then generate. Nothing is
        generated, and nothing spent, until you approve it.
      </p>
      <p className="font-mono text-[0.68rem] mb-6" style={{ color: 'var(--text-on-ink-dim)' }}>
        {backlog.inReview} waiting for review · {unreviewed(backlog)} unreviewed in total · {backlog.generated24h} generated in the last 24h
        {settings.mode === 'auto' ? ' · AUTOMATIC mode is on: stories are also generated without approval' : ''}
      </p>
      <ProposalList proposals={proposals} categories={categories} weekly={weekly} />
    </div>
  );
}
