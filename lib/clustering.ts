// Hybrid clustering (v1): suggests which raw candidates are probably the
// same story, so a reviewer can confirm/override rather than group by hand.
export type Candidate = {
  id: string;
  // A handful of ingested rows have come through with a null/empty title
  // (bad scrape) -- tokenize() must never crash the whole /review Server
  // Component render over one malformed row, so this is typed loosely and
  // handled defensively below rather than assumed non-null.
  title: string | null | undefined;
  domain: string;
  source_country: string | null;
  seen_date: string;
  url: string;
};

export type ClusterSuggestion = {
  key: string;
  candidateIds: string[];
  score: number;
};

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'on', 'and', 'or', 'for', 'with', 'as',
  'by', 'at', 'is', 'are', 'was', 'were', 'be', 'it', 'this', 'that', 'from',
  'has', 'have', 'will', 'after', 'over', 'amid', 'says', 'say', 'said',
]);

const SIMILARITY_THRESHOLD = 0.20;
const MAX_HOURS_APART = 96;

export function tokenize(title: string | null | undefined): Set<string> {
  return new Set(
    (title ?? '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function suggestClusters(candidates: Candidate[]): ClusterSuggestion[] {
  const tokensById = new Map(candidates.map((c) => [c.id, tokenize(c.title)]));
  const parent = new Map(candidates.map((c) => [c.id, c.id]));

  function find(id: string): string {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let cur = id;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  }
  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      const hoursApart =
        Math.abs(new Date(a.seen_date).getTime() - new Date(b.seen_date).getTime()) / 36e5;
      if (hoursApart > MAX_HOURS_APART) continue;
      const sim = jaccard(tokensById.get(a.id)!, tokensById.get(b.id)!);
      if (sim >= SIMILARITY_THRESHOLD) union(a.id, b.id);
    }
  }

  const groups = new Map<string, string[]>();
  for (const c of candidates) {
    const root = find(c.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(c.id);
  }

  const suggestions: ClusterSuggestion[] = [];
  for (const [root, ids] of groups) {
    if (ids.length < 2) continue;
    suggestions.push({ key: root, candidateIds: ids, score: ids.length });
  }
  return suggestions.sort((a, b) => b.score - a.score);
}

const ATTACH_SIMILARITY = 0.15;
export const MAX_SOURCES_PER_GROUP = 8;

// Tops up each candidate group with other not-yet-used candidates that read
// like the same story, so a story built from a single article still carries
// several sources. Greedy, group by group; never reuses a candidate or adds a
// second article from a domain the group already has.
export function attachRelated<T extends Candidate>(
  groups: string[][],
  pool: T[],
  options: { threshold?: number; maxPerGroup?: number } = {},
): string[][] {
  const threshold = options.threshold ?? ATTACH_SIMILARITY;
  const maxPerGroup = options.maxPerGroup ?? MAX_SOURCES_PER_GROUP;
  const byId = new Map(pool.map((c) => [c.id, c]));
  const used = new Set(groups.flat());
  const tokens = new Map(pool.map((c) => [c.id, tokenize(c.title)]));

  return groups.map((ids) => {
    const members = ids.map((id) => byId.get(id)).filter((c): c is T => !!c);
    if (members.length === 0 || members.length >= maxPerGroup) return ids;
    const domains = new Set(members.map((m) => m.domain));

    const scored: { id: string; score: number }[] = [];
    for (const c of pool) {
      if (used.has(c.id) || domains.has(c.domain)) continue;
      let best = 0;
      for (const m of members) {
        const hoursApart =
          Math.abs(new Date(m.seen_date).getTime() - new Date(c.seen_date).getTime()) / 36e5;
        if (hoursApart > MAX_HOURS_APART) continue;
        best = Math.max(best, jaccard(tokens.get(m.id)!, tokens.get(c.id)!));
      }
      if (best >= threshold) scored.push({ id: c.id, score: best });
    }
    scored.sort((a, b) => b.score - a.score);

    const out = [...ids];
    for (const { id } of scored) {
      if (out.length >= maxPerGroup) break;
      const c = byId.get(id)!;
      if (domains.has(c.domain)) continue;
      domains.add(c.domain);
      used.add(id);
      out.push(id);
    }
    return out;
  });
}
