import { supabaseServer } from '@/lib/supabase-server';
import { suggestClusters } from '@/lib/clustering';
import { submitBatchGeneration } from '@/lib/anthropic-server';

const TRUSTED_DOMAINS = new Set([
  "reuters.com", "wsj.com", "washingtonpost.com", "apnews.com", "bbc.com",
  "ft.com", "bloomberg.com", "economist.com", "nytimes.com", "cnn.com",
  "rferl.org", "aljazeera.com", "theguardian.com", "foreignpolicy.com",
  "foreignaffairs.com", "politico.com", "axios.com", "thehill.com",
  "scmp.com", "hindustantimes.com", "thehindu.com", "ndtv.com",
  "economictimes.indiatimes.com", "timesofindia.indiatimes.com",
  "jpost.com", "haaretz.com", "middleeasteye.net", "arabnews.com",
  "dawn.com", "thenews.com.pk", "dw.com", "euronews.com",
]);

const TOPIC_KEYWORDS = [
  "tariff", "sanction", "military", "strait", "defense", "diplomatic",
  "trade deal", "treaty", "alliance", "strike", "border", "conflict",
  "summit", "embargo", "nuclear", "troops", "ceasefire", "negotiat",
];

type ScorableCandidate = { title: string; domain: string; seen_date: string | null };

function scoreCandidate(c: ScorableCandidate): number {
  let score = 0;
  if (TRUSTED_DOMAINS.has(c.domain)) score += 30;

  const titleLower = c.title.toLowerCase();
  const keywordMatches = TOPIC_KEYWORDS.filter((k) => titleLower.includes(k)).length;
  score += Math.min(keywordMatches * 15, 45);

  if (c.seen_date) {
    const hoursOld = (Date.now() - new Date(c.seen_date).getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 25 - hoursOld);
  }

  return score;
}

export type AutoGenerateResult = {
  batchId: string;
  groupCount: number;
};

export async function autoGenerateBatch(limit: number): Promise<AutoGenerateResult> {
  const supabase = supabaseServer();

  const { data: candidates, error: candidatesError } = await supabase
    .from('story_candidates')
    .select('id, url, title, source_country, domain, seen_date, tone, query_tag')
    .eq('status', 'pending')
    .order('seen_date', { ascending: false })
    .limit(300);

  if (candidatesError) {
    throw new Error(`Failed to load candidates: ${candidatesError.message}`);
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentStories } = await supabase
    .from('stories')
    .select('headline')
    .gte('created_at', sevenDaysAgo);

  const recentHeadlineWords = new Set(
    (recentStories ?? []).flatMap((s: { headline: string }) =>
      s.headline.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4)
    )
  );

  function isDuplicate(title: string): boolean {
    const words = title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const matches = words.filter((w) => recentHeadlineWords.has(w)).length;
    return matches >= 4;
  }

  const SCORE_FLOOR = 35;

  const all = (candidates ?? []).filter((c) => {
    if (isDuplicate(c.title)) return false;
    if (scoreCandidate(c) < SCORE_FLOOR) return false;
    return true;
  });

  const clusters = suggestClusters(all);
  const clusteredIds = new Set(clusters.flatMap((c) => c.candidateIds));

  const groups: string[][] = clusters.map((c) => c.candidateIds).slice(0, limit);

  if (groups.length < limit) {
    const singles = all
      .filter((c) => !clusteredIds.has(c.id))
      .sort((a, b) => scoreCandidate(b) - scoreCandidate(a))
      .slice(0, limit - groups.length);
    for (const single of singles) {
      groups.push([single.id]);
    }
  }

  if (groups.length === 0) {
    throw new Error('No pending candidates above score threshold available.');
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

  const allCandidateIds = groups.flat();
  await supabase
    .from('story_candidates')
    .update({ status: 'batch_pending' })
    .in('id', allCandidateIds);

  return { batchId: anthropicBatchId, groupCount: groups.length };
}