import { supabaseServer } from '@/lib/supabase-server';
import { suggestClusters } from '@/lib/clustering';
import { submitBatchGeneration } from '@/lib/anthropic-server';

export type AutoGenerateResult = {
  batchId: string;
  groupCount: number;
};

// Submits pending candidates as a single Batch API request instead of
// generating synchronously one at a time -- ~50% cheaper, results arrive
// asynchronously and are picked up by /api/check-batches once ready.
// Clustered groups (2+ related articles) go first, filled out with the
// most recent single candidates up to `limit`.
export async function autoGenerateBatch(limit: number): Promise<AutoGenerateResult> {
  const supabase = supabaseServer();

  const { data: candidates, error: candidatesError } = await supabase
    .from('story_candidates')
    .select('id, url, title, source_country, domain, seen_date, tone, query_tag')
    .eq('status', 'pending')
    .order('seen_date', { ascending: false })
    .limit(150);

  if (candidatesError) {
    throw new Error(`Failed to load candidates: ${candidatesError.message}`);
  }

  const all = candidates ?? [];
  const clusters = suggestClusters(all);
  const clusteredIds = new Set(clusters.flatMap((c) => c.candidateIds));

  const groups: string[][] = clusters.map((c) => c.candidateIds).slice(0, limit);

  if (groups.length < limit) {
    const singles = all.filter((c) => !clusteredIds.has(c.id)).slice(0, limit - groups.length);
    for (const single of singles) {
      groups.push([single.id]);
    }
  }

  if (groups.length === 0) {
    throw new Error('No pending candidates available to generate from.');
  }

  const candidateById = new Map(all.map((c) => [c.id, c]));

  const batchRequests = groups.map((candidateIds, i) => ({
    customId: `group-${i}`,
    articles: candidateIds
      .map((id) => candidateById.get(id))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => ({
        title: c.title,
        domain: c.domain,
        sourceCountry: c.source_country,
        url: c.url,
      })),
  }));

  const anthropicBatchId = await submitBatchGeneration(batchRequests);

  const { error: insertError } = await supabase.from('generation_batches').insert({
    anthropic_batch_id: anthropicBatchId,
    status: 'submitted',
    candidate_groups: groups,
  });

  if (insertError) {
    throw new Error(`Batch submitted to Anthropic (${anthropicBatchId}) but failed to save tracking record: ${insertError.message}`);
  }

  // Mark these candidates as approved-pending so they aren't picked up
  // again by a second batch before this one resolves.
  const allCandidateIds = groups.flat();
  await supabase
    .from('story_candidates')
    .update({ status: 'batch_pending' })
    .in('id', allCandidateIds);

  return { batchId: anthropicBatchId, groupCount: groups.length };
}
