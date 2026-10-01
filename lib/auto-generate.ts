import { supabaseServer } from '@/lib/supabase-server';
import { suggestClusters, attachRelated, coverageOf, pickSources, jaccard, tokenize, type Candidate } from '@/lib/clustering';
import { fetchRelatedArticles } from '@/lib/thenewsapi';
import { submitBatchGeneration } from '@/lib/anthropic-server';
import { TRUSTED_DOMAINS } from '@/lib/trustedDomains';

const TOPIC_KEYWORDS = [
  // Geopolitics & conflict
  "tariff", "sanction", "military", "strait", "defense", "diplomatic",
  "trade deal", "treaty", "alliance", "strike", "border", "conflict",
  "summit", "embargo", "nuclear", "troops", "ceasefire", "negotiat",
  // Economics & politics (surface non-conflict stories)
  "election", "protest", "economy", "investment", "inflation", "energy",
  "coup", "government", "opposition", "parliament", "referendum",
  // Geographic signals for underrepresented regions
  "africa", "nigeria", "kenya", "ethiopia", "ghana", "senegal",
  "brazil", "mexico", "colombia", "argentina", "venezuela",
  "indonesia", "vietnam", "philippines", "thailand", "myanmar",
  "pakistan", "bangladesh", "sri lanka",
  "saudi", "qatar", "gulf", "asean",
  "kazakhstan", "uzbekistan",
];

type ScorableCandidate = { title: string | null; domain: string; seen_date: string | null };

function scoreCandidate(c: ScorableCandidate): number {
  let score = 0;
  if (TRUSTED_DOMAINS.has(c.domain)) score += 30;

  // A null/empty title (bad ingest row) must never throw here -- one
  // malformed candidate out of hundreds previously killed the entire batch
  // before anything got submitted, which is why nothing was generating at
  // all, not even for the clean candidates.
  const titleLower = (c.title ?? '').toLowerCase();
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
    .or(`seen_date.gte.${new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString()},seen_date.is.null`)
    .order('seen_date', { ascending: false })
    .limit(1000);

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

  function isDuplicate(title: string | null): boolean {
    const words = (title ?? '').toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const matches = words.filter((w) => recentHeadlineWords.has(w)).length;
    return matches >= 4;
  }

  const SCORE_FLOOR = 35;

  const all = (candidates ?? []).filter((c) => {
    // A candidate with no usable title can't be scored or clustered
    // meaningfully -- drop it here (once, cleanly) rather than let it reach
    // scoreCandidate/isDuplicate/suggestClusters where a crash would take
    // down the whole batch instead of just this one row.
    if (!c.title || !c.title.trim()) return false;
    if (isDuplicate(c.title)) return false;
    if (scoreCandidate(c) < SCORE_FLOOR) return false;
    return true;
  });

  // Everything with a usable title that isn't a repeat of a recent story --
  // including articles below the score floor. They can't seed a story on
  // their own, but they are fair game as extra sources for one.
  const pool = (candidates ?? []).filter((c) => c.title && c.title.trim() && !isDuplicate(c.title));

  // Cluster the whole pool, not just the high-scoring articles: a story's
  // source count is how many outlets covered it, and regional outlets score
  // low on their own. A cluster qualifies if any member clears the floor,
  // and clusters are ranked by how widely they are covered.
  const poolCandidates = pool as unknown as (Candidate & { id: string })[];
  const poolMap = new Map(pool.map((c) => [c.id, c]));
  const allClusters = suggestClusters(poolCandidates);
  // Which cluster each article belongs to, including clusters filtered out
  // below -- so leftovers of a rejected cluster (say, one outlet publishing
  // five pieces on the same event) can become at most one story, not five.
  const clusterOf = new Map<string, string>(allClusters.flatMap((c) => c.candidateIds.map((id) => [id, c.key] as const)));
  const clusters = allClusters
    .map((c) => {
      const members = c.candidateIds.map((id) => poolMap.get(id)!).filter(Boolean);
      return {
        members,
        ...coverageOf(members),
        best: Math.max(...members.map((m) => scoreCandidate(m))),
      };
    })
    .filter((c) => c.best >= SCORE_FLOOR && c.outlets >= 2)
    .sort((a, b) => b.outlets - a.outlets || b.countries - a.countries || b.best - a.best);
  const clusteredIds = new Set(clusters.flatMap((c) => c.members.map((m) => m.id)));

  const groups: string[][] = clusters.slice(0, limit).map((c) =>
    pickSources(c.members as unknown as (Candidate & { id: string })[])
      // Trusted outlets first: the first article is the story's primary
      // source (its photo credit and headline lead).
      .sort((a, b) => Number(TRUSTED_DOMAINS.has(b.domain)) - Number(TRUSTED_DOMAINS.has(a.domain)))
      .map((m) => m.id),
  );

  if (groups.length < limit) {
    const usedClusters = new Set<string>();
    const singles = all
      .filter((c) => !clusteredIds.has(c.id))
      .sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
    for (const single of singles) {
      if (groups.length >= limit) break;
      const key = clusterOf.get(single.id);
      if (key) {
        if (usedClusters.has(key)) continue;
        usedClusters.add(key);
      }
      groups.push([single.id]);
    }
  }

  if (groups.length === 0) {
    throw new Error('No pending candidates above score threshold available.');
  }

  // Free-tier TheNewsAPI is ~100 requests/day, so the extra lookups are
  // budgeted: one request per still-thin story, best-scoring stories first.
  const MIN_SOURCES = 3;
  const lookupBudget = Number(process.env.ENRICH_MAX_LOOKUPS ?? 15);
  const poolById = new Map(pool.map((c) => [c.id, c]));

  // 1) Free: attach related articles we have already ingested.
  const grouped = attachRelated(groups, pool);
  groups.length = 0;
  groups.push(...grouped);

  // 2) Budgeted: ask TheNewsAPI about stories that are still under-sourced.
  const thin = groups
    .map((ids, index) => ({ ids, index }))
    .filter(({ ids }) => new Set(ids.map((id) => poolById.get(id)?.domain)).size < MIN_SOURCES)
    .sort((a, b) => scoreCandidate(poolById.get(b.ids[0])!) - scoreCandidate(poolById.get(a.ids[0])!))
    .slice(0, Math.max(0, lookupBudget));

  const extraByGroup = new Map<number, string[]>();
  const claimed = new Set(groups.flat());
  for (let i = 0; i < thin.length; i += 3) {
    await Promise.all(
      thin.slice(i, i + 3).map(async ({ ids, index }) => {
        const lead = poolById.get(ids[0]);
        if (!lead) return;
        const have = new Set(ids.map((id) => poolById.get(id)?.domain));
        const leadTokens = tokenize(lead.title);
        const found = (await fetchRelatedArticles(lead.title!)).filter(
          (a) => !have.has(a.domain) && jaccard(leadTokens, tokenize(a.title)) >= 0.1,
        );
        if (found.length === 0) return;
        const rows = found.map((a) => ({
          url: a.url,
          title: a.title,
          domain: a.domain,
          source_country: a.sourcecountry,
          seen_date: a.seendate || new Date().toISOString(),
          tone: 0,
          query_tag: 'enrich',
        }));
        await supabase.from('story_candidates').upsert(rows, { onConflict: 'url', ignoreDuplicates: true });
        // Only claim rows that are still unassigned (a URL we already had may
        // belong to another story).
        const { data: stored } = await supabase
          .from('story_candidates')
          .select('id, url, title, source_country, domain, seen_date, status')
          .in('url', rows.map((r) => r.url))
          .eq('status', 'pending');
        const fresh = (stored ?? []).filter((r) => !claimed.has(r.id));
        for (const r of fresh) claimed.add(r.id);
        for (const r of fresh) poolById.set(r.id, r as never);
        extraByGroup.set(index, fresh.map((r) => r.id));
      }),
    );
  }
  for (const [index, ids] of extraByGroup) {
    groups[index] = [...groups[index], ...ids].slice(0, 8);
  }

  const candidateById = poolById;

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