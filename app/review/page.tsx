import { supabaseServer } from '@/lib/supabase-server';
import { suggestClusters } from '@/lib/clustering';
import { ReviewBoard } from './ReviewBoard';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
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

  const { data: drafts, error: draftsError } = await supabase
    .from('story_drafts')
    .select(
      'slug, headline, dek, body, status, category, read_time, has_video, impact_nodes, chanakya_analysis, off_lens, workflow_status, created_at, updated_at, articles',
    )
    .eq('workflow_status', 'in_review')
    .order('updated_at', { ascending: false });

  if (draftsError) {
    throw new Error(`Failed to load drafts: ${draftsError.message}`);
  }

  const draftCandidateIds = Array.from(
    new Set(
      (drafts ?? []).flatMap((d) =>
        ((d.articles ?? []) as { candidate_id: string }[]).map((a) => a.candidate_id),
      ),
    ),
  );

  const { data: draftCandidateRows } = draftCandidateIds.length
    ? await supabase
        .from('story_candidates')
        .select('id, url, title, source_country, domain, seen_date, tone, query_tag')
        .in('id', draftCandidateIds)
    : { data: [] };

  const suggestions = suggestClusters(candidates ?? []);

  return (
    <ReviewBoard
      candidates={candidates ?? []}
      suggestions={suggestions}
      drafts={drafts ?? []}
      draftCandidates={draftCandidateRows ?? []}
    />
  );
}