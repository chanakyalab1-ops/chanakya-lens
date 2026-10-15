import { jaccard, tokenize } from "./clustering";

// Spots a candidate story that repeats one we already have, using only the
// article titles and links we hold -- no model call, so it costs nothing.
//
// Two titles about the same event usually share most of their distinctive
// words even when worded differently ("launches major offensive" / "announces
// major military operation"), so each of a candidate's titles is compared with
// each of an existing story's titles one pair at a time. (The old check pooled
// the words of every recent story into one set, which both blocked genuinely
// new stories and missed real repeats.)

export type StoryState = "published" | "in_review" | "generating" | "proposed";

export type KnownStory = {
  slug: string | null;
  headline: string;
  state: StoryState;
  // Headline plus the titles of the articles the story was built from.
  titles: string[];
  urls: string[];
};

export type SimilarStory = {
  slug: string | null;
  headline: string;
  state: StoryState;
  score: number;
  reason: "shared_article" | "similar_titles";
};

// Two titles describe the same event when they overlap strongly, or
// moderately but on at least three distinctive words.
const STRONG = 0.3;
const WEAK = 0.22;
const WEAK_MIN_SHARED = 3;

export function normalizeUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function sharedCount(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n;
}

// Best matching score of one title against a list of tokenized titles, or 0.
function bestMatch(title: Set<string>, others: Set<string>[]): number {
  let best = 0;
  for (const other of others) {
    const j = jaccard(title, other);
    if (j >= STRONG || (j >= WEAK && sharedCount(title, other) >= WEAK_MIN_SHARED)) best = Math.max(best, j);
  }
  return best;
}

export function compareTexts(
  group: { titles: string[]; urls: string[] },
  known: { titles: string[]; urls: string[] },
): { score: number; reason: SimilarStory["reason"] } | null {
  const knownUrls = new Set(known.urls.filter(Boolean).map(normalizeUrl));
  if (group.urls.some((u) => u && knownUrls.has(normalizeUrl(u)))) return { score: 1, reason: "shared_article" };

  const groupTitles = group.titles.map(tokenize).filter((t) => t.size > 0);
  const knownTitles = known.titles.map(tokenize).filter((t) => t.size > 0);
  if (groupTitles.length === 0 || knownTitles.length === 0) return null;

  const scores = groupTitles.map((t) => bestMatch(t, knownTitles)).filter((s) => s > 0);
  // At least a third of the candidate's articles must match, so one stray
  // article that happens to share words doesn't flag a whole story.
  const needed = Math.max(1, Math.ceil(groupTitles.length / 3));
  if (scores.length < needed) return null;
  return { score: Math.max(...scores), reason: "similar_titles" };
}

export function findSimilarStory(group: { titles: string[]; urls: string[] }, known: KnownStory[]): SimilarStory | null {
  let best: SimilarStory | null = null;
  for (const k of known) {
    const hit = compareTexts(group, k);
    if (hit && (!best || hit.score > best.score)) {
      best = { slug: k.slug, headline: k.headline, state: k.state, score: hit.score, reason: hit.reason };
    }
  }
  return best;
}

export type StoryPair = { a: { slug: string; headline: string }; b: { slug: string; headline: string }; score: number; reason: SimilarStory["reason"] };

// Pairs among stories already published, for cleaning up repeats.
export function findSimilarPairs(stories: { slug: string; headline: string; titles: string[]; urls: string[] }[]): StoryPair[] {
  const pairs: StoryPair[] = [];
  for (let i = 0; i < stories.length; i++) {
    for (let j = i + 1; j < stories.length; j++) {
      const hit = compareTexts(stories[i], stories[j]);
      if (hit) {
        pairs.push({ a: { slug: stories[i].slug, headline: stories[i].headline }, b: { slug: stories[j].slug, headline: stories[j].headline }, score: hit.score, reason: hit.reason });
      }
    }
  }
  return pairs.sort((x, y) => y.score - x.score);
}
