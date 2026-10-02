import { supabaseServer } from '@/lib/supabase-server';
import { suggestClusters, attachRelated, coverageOf, pickSources, jaccard, tokenize, type Candidate } from '@/lib/clustering';
import { fetchRelatedArticles } from '@/lib/thenewsapi';
import { describePlan, getBacklog, planGeneration, readBufferSettings } from '@/lib/pipelineBuffer';
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
  // null when nothing was submitted (see `skipped`).
  batchId: string | null;
  groupCount: number;
  skipped?: string;
};

export type CandidateRow = {
  id: string;
  url: string;
  title: string | null;
  source_country: string | null;
  domain: string;
  seen_date: string | null;
  tone?: number | null;
  query_tag?: string | null;
};

const CANDIDATE_COLUMNS = 'id, url, title, source_country, domain, seen_date, tone, query_tag';
const SCORE_FLOOR = 35;

// A story proposed for approval: the articles that cover one event, ranked by
// how widely it is covered. Nothing is generated (and nothing spent) until a
// person approves it.
export type Proposal = {
  id: string;
  candidateIds: string[];
  headline: string;
  outlets: number;
  countries: number;
  newestAt: string | null;
  sources: { id: string; domain: string; country: string | null; title: string }[];
};

export function toProposal(ids: string[], rows: Map<string, CandidateRow>): Proposal | null {
  const members = ids.map((id) => rows.get(id)).filter((r): r is CandidateRow => !!r);
  if (members.length === 0) return null;
  const { outlets, countries } = coverageOf(members as unknown as Pick<Candidate, 'domain' | 'source_country'>[]);
  const dates = members.map((m) => m.seen_date).filter((d): d is string => !!d).sort();
  return {
    id: members[0].id,
    candidateIds: members.map((m) => m.id),
    headline: members[0].title ?? '',
    outlets,
    countries,
    newestAt: dates.length ? dates[dates.length - 1] : null,
    sources: members.map((m) => ({ id: m.id, domain: m.domain, country: m.source_country, title: m.title ?? '' })),
  };
}

async function loadCandidates(supabase: ReturnType<typeof supabaseServer>): Promise<CandidateRow[]> {
  const { data, error } = await supabase
    .from('story_candidates')
    .select(CANDIDATE_COLUMNS)
    .eq('status', 'pending')
    .or(`seen_date.gte.${new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString()},seen_date.is.null`)
    .order('seen_date', { ascending: false })
    .limit(1000);
  if (error) throw new Error(`Failed to load candidates: ${error.message}`);
  return (data ?? []) as CandidateRow[];
}

async function recentHeadlineFilter(supabase: ReturnType<typeof supabaseServer>) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentStories } = await supabase.from('stories').select('headline').gte('created_at', sevenDaysAgo);
  const recentWords = new Set(
    (recentStories ?? []).flatMap((s: { headline: string }) =>
      s.headline.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4),
    ),
  );
  return (title: string | null): boolean => {
    const words = (title ?? '').toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    return words.filter((w) => recentWords.has(w)).length >= 4;
  };
}

// Ranks the pending pool into story groups: clusters first, most widely
// covered on top, then single high-scoring articles. Pure, so it can be
// tested without a database.
export function buildGroups(
  candidates: CandidateRow[],
  limit: number,
  isDuplicate: (title: string | null) => boolean = () => false,
): { groups: string[][]; pool: CandidateRow[] } {
  // Articles with no usable title can't be scored or clustered -- drop them
  // here rather than let one bad row crash the whole run.
  const all = candidates.filter((c) => {
    if (!c.title || !c.title.trim()) return false;
    if (isDuplicate(c.title)) return false;
    return scoreCandidate(c) >= SCORE_FLOOR;
  });

  // Everything usable and not a repeat of a recent story -- including
  // articles below the score floor. They can't seed a story on their own but
  // are fair game as extra sources for one.
  const pool = candidates.filter((c) => c.title && c.title.trim() && !isDuplicate(c.title));
  const poolMap = new Map(pool.map((c) => [c.id, c]));

  // Cluster the whole pool, not just the high scorers: a story's source count
  // is how many outlets covered it, and regional outlets score low alone.
  const allClusters = suggestClusters(pool as unknown as (Candidate & { id: string })[]);
  // Remember every article's cluster, including clusters filtered out below,
  // so leftovers of a rejected cluster become at most one story.
  const clusterOf = new Map<string, string>(allClusters.flatMap((c) => c.candidateIds.map((id) => [id, c.key] as const)));
  const clusters = allClusters
    .map((c) => {
      const members = c.candidateIds.map((id) => poolMap.get(id)!).filter(Boolean);
      return {
        members,
        ...coverageOf(members as unknown as Pick<Candidate, 'domain' | 'source_country'>[]),
        best: Math.max(...members.map((m) => scoreCandidate(m))),
      };
    })
    .filter((c) => c.best >= SCORE_FLOOR && c.outlets >= 2)
    .sort((a, b) => b.outlets - a.outlets || b.countries - a.countries || b.best - a.best);
  const clusteredIds = new Set(clusters.flatMap((c) => c.members.map((m) => m.id)));

  const groups: string[][] = clusters.slice(0, limit).map((c) =>
    pickSources(c.members as unknown as (Candidate & { id: string })[])
      // Trusted outlets first: the first article is the story's primary source.
      .sort((a, b) => Number(TRUSTED_DOMAINS.has(b.domain)) - Number(TRUSTED_DOMAINS.has(a.domain)))
      .map((m) => m.id),
  );

  if (groups.length < limit) {
    const usedClusters = new Set<string>();
    const singles = all.filter((c) => !clusteredIds.has(c.id)).sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
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

  return { groups, pool };
}

// The stories worth generating right now, best first. Costs nothing.
export async function proposeStories(limit = 20): Promise<Proposal[]> {
  const supabase = supabaseServer();
  const [candidates, isDuplicate] = await Promise.all([loadCandidates(supabase), recentHeadlineFilter(supabase)]);
  const { groups, pool } = buildGroups(candidates, limit, isDuplicate);
  // Free top-up from articles we already hold; no paid lookups just to browse.
  const grouped = attachRelated(groups, pool as unknown as (Candidate & { id: string })[]);
  const rows = new Map(pool.map((c) => [c.id, c]));
  return grouped.map((ids) => toProposal(ids, rows)).filter((p): p is Proposal => !!p);
}

// Free-tier TheNewsAPI is ~100 requests/day, so the extra lookups are
// budgeted: one request per still-thin story, best-scoring first.
async function enrichThinGroups(
  supabase: ReturnType<typeof supabaseServer>,
  groups: string[][],
  rows: Map<string, CandidateRow>,
): Promise<string[][]> {
  const MIN_SOURCES = 3;
  const lookupBudget = Number(process.env.ENRICH_MAX_LOOKUPS ?? 15);
  const thin = groups
    .map((ids, index) => ({ ids, index }))
    .filter(({ ids }) => new Set(ids.map((id) => rows.get(id)?.domain)).size < MIN_SOURCES)
    .sort((a, b) => scoreCandidate(rows.get(b.ids[0])!) - scoreCandidate(rows.get(a.ids[0])!))
    .slice(0, Math.max(0, lookupBudget));

  const extraByGroup = new Map<number, string[]>();
  const claimed = new Set(groups.flat());
  for (let i = 0; i < thin.length; i += 3) {
    await Promise.all(
      thin.slice(i, i + 3).map(async ({ ids, index }) => {
        const lead = rows.get(ids[0]);
        if (!lead?.title) return;
        const have = new Set(ids.map((id) => rows.get(id)?.domain));
        const leadTokens = tokenize(lead.title);
        const found = (await fetchRelatedArticles(lead.title)).filter(
          (a) => !have.has(a.domain) && jaccard(leadTokens, tokenize(a.title)) >= 0.1,
        );
        if (found.length === 0) return;
        const newRows = found.map((a) => ({
          url: a.url,
          title: a.title,
          domain: a.domain,
          source_country: a.sourcecountry,
          seen_date: a.seendate || new Date().toISOString(),
          tone: 0,
          query_tag: 'enrich',
        }));
        await supabase.from('story_candidates').upsert(newRows, { onConflict: 'url', ignoreDuplicates: true });
        // Only claim rows still unassigned (a URL we already had may belong to another story).
        const { data: stored } = await supabase
          .from('story_candidates')
          .select(CANDIDATE_COLUMNS)
          .in('url', newRows.map((r) => r.url))
          .eq('status', 'pending');
        const fresh = ((stored ?? []) as CandidateRow[]).filter((r) => !claimed.has(r.id));
        for (const r of fresh) {
          claimed.add(r.id);
          rows.set(r.id, r);
        }
        extraByGroup.set(index, fresh.map((r) => r.id));
      }),
    );
  }
  return groups.map((g, index) => [...g, ...(extraByGroup.get(index) ?? [])].slice(0, 8));
}

// Submits the given groups of candidate articles for generation (one Anthropic
// batch). This is the step that costs money; callers decide when it runs.
export async function submitGroups(candidateGroups: string[][], options: { enrich?: boolean } = {}): Promise<AutoGenerateResult> {
  const supabase = supabaseServer();

  // Re-read from the database: only articles still pending may be used, so a
  // double-click or a stale page can never submit the same story twice.
  const wanted = [...new Set(candidateGroups.flat())];
  if (wanted.length === 0) return { batchId: null, groupCount: 0, skipped: 'Nothing to generate.' };
  const { data, error } = await supabase.from('story_candidates').select(CANDIDATE_COLUMNS).in('id', wanted).eq('status', 'pending');
  if (error) throw new Error(`Failed to load candidates: ${error.message}`);
  const rows = new Map(((data ?? []) as CandidateRow[]).map((r) => [r.id, r]));

  const seen = new Set<string>();
  let groups = candidateGroups
    .map((g) => g.filter((id) => rows.has(id) && !seen.has(id) && (seen.add(id), true)))
    .filter((g) => g.length > 0);
  if (groups.length === 0) return { batchId: null, groupCount: 0, skipped: 'Those articles are no longer pending.' };

  if (options.enrich) groups = await enrichThinGroups(supabase, groups, rows);

  const batchRequests = groups.map((candidateIds, i) => ({
    customId: `group-${i}`,
    articles: candidateIds
      .map((id) => rows.get(id))
      .filter((c): c is CandidateRow => !!c)
      .map((c) => ({ title: c.title ?? '', domain: c.domain, sourceCountry: c.source_country, url: c.url })),
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

  await supabase.from('story_candidates').update({ status: 'batch_pending' }).in('id', groups.flat());

  return { batchId: anthropicBatchId, groupCount: groups.length };
}

// The automatic path (cron, and the review queue's "auto batch" button).
// With `respectBuffer` it first checks the mode and the buffer: in approval
// mode (the default) it generates nothing -- stories wait at /review/proposals
// until a person approves them.
export async function autoGenerateBatch(
  requested: number,
  options: { respectBuffer?: boolean } = {},
): Promise<AutoGenerateResult> {
  const supabase = supabaseServer();

  let limit = requested;
  if (options.respectBuffer ?? true) {
    const settings = readBufferSettings();
    if (settings.mode === 'approve') {
      return {
        batchId: null,
        groupCount: 0,
        skipped: 'Approval mode: stories are proposed at /review/proposals and only generated once you approve them.',
      };
    }
    const backlog = await getBacklog(supabase);
    const plan = planGeneration(backlog, settings, requested);
    if (plan.allow === 0) {
      return { batchId: null, groupCount: 0, skipped: describePlan(plan, backlog, settings) };
    }
    limit = plan.allow;
  }

  const [candidates, isDuplicate] = await Promise.all([loadCandidates(supabase), recentHeadlineFilter(supabase)]);
  const { groups, pool } = buildGroups(candidates, limit, isDuplicate);
  if (groups.length === 0) throw new Error('No pending candidates above score threshold available.');

  return submitGroups(attachRelated(groups, pool as unknown as (Candidate & { id: string })[]), { enrich: true });
}
