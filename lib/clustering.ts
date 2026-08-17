// Hybrid clustering (v1): suggests which raw candidates are probably the
// same story, so a reviewer can confirm/override rather than group by hand.
export type Candidate = {
  id: string;
  title: string;
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

const SIMILARITY_THRESHOLD = 0.28;
const MAX_HOURS_APART = 60;

function tokenize(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
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