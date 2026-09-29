import { supabaseServer } from '@/lib/supabase-server';
import { suggestClusters } from '@/lib/clustering';
import { ReviewBoard } from './ReviewBoard';

export const dynamic = 'force-dynamic';

const DRAFTS_PER_PAGE = 20;

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ draftPage?: string }> }) {
  const { draftPage } = await searchParams;
  const page = Math.max(1, parseInt(draftPage ?? '1', 10) || 1);
  const from = (page - 1) * DRAFTS_PER_PAGE;
  const to = from + DRAFTS_PER_PAGE - 1;

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

  const { data: drafts, error: draftsError, count: draftsTotal } = await supabase
    .from('story_drafts')
    .select(
      'slug, headline, dek, body, status, category, read_time, has_video, impact_nodes, chanakya_analysis, off_lens, workflow_status, quality_score, fact_check_status, fact_check_flags, created_at, updated_at, articles',
      { count: 'exact' },
    )
    .eq('workflow_status', 'in_review')
    .order('updated_at', { ascending: false })
    .range(from, to);

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
      draftPage={page}
      draftTotal={draftsTotal ?? 0}
      draftsPerPage={DRAFTS_PER_PAGE}
    />
  );
}