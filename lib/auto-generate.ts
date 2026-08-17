import { supabaseServer } from '@/lib/supabase-server';
import { suggestClusters } from '@/lib/clustering';
import { generateDraft } from '@/app/review/actions';

export type AutoGenerateResult = {
  attempted: number;
  succeeded: string[];
  failed: { candidateIds: string[]; error: string }[];
};

// Generates drafts for pending candidates, up to `limit` total. Clustered
// groups (2+ related articles) go first — corroborated by multiple sources,
// safer bet for unattended generation. Remaining slots are filled with the
// most recent single candidates, since most nights won't have enough
// clusters alone to produce a useful batch.
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

  const batches: string[][] = clusters.map((c) => c.candidateIds).slice(0, limit);

  if (batches.length < limit) {
    const singles = all.filter((c) => !clusteredIds.has(c.id)).slice(0, limit - batches.length);
    for (const single of singles) {
      batches.push([single.id]);
    }
  }

  const result: AutoGenerateResult = { attempted: batches.length, succeeded: [], failed: [] };

  for (const candidateIds of batches) {
    try {
      const slug = await generateDraft(candidateIds);
      result.succeeded.push(slug);
    } catch (e) {
      result.failed.push({
        candidateIds,
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  return result;
}