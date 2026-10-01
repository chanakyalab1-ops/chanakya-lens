import { jaccard, tokenize, pickSources, MAX_SOURCES_FOR_STORY, type Candidate } from "./clustering";
import type { NewsHit } from "./googleNews";
import { canonicalDomain, countryForDomain, isAggregator } from "./outletCountries";
import { COUNTRY_NAMES } from "./regions";

export const WINDOW_DAYS_BEFORE = 4;
export const WINDOW_DAYS_AFTER = 5;
const MIN_SIMILARITY = 0.12;
// Two shared words is easy to hit by accident ("Pakistan" + a stray filler
// word); three means the articles really overlap.
const MIN_SHARED_WORDS = 3;

const SKIP_WORDS = new Set(["The", "A", "An", "As", "After", "Amid", "Over", "With", "For", "And", "But", "Why", "How", "What", "Will", "Could", "Says"]);

// Names and places carry a headline's identity, so search on those; fall back
// to the longest plain words when there are fewer than two.
export function headlineKeywords(headline: string, max = 4): string {
  const words = headline.replace(/[^\p{L}\p{N}\s'-]/gu, " ").split(/\s+/).filter(Boolean);
  const long = words.filter((w) => w.length > 3);
  // In a Title Case headline every word is capitalised, so capitals say
  // nothing about which words are names -- use known countries instead.
  const titleCase = long.length > 0 && long.filter((w) => /^[A-Z]/.test(w)).length / long.length > 0.6;
  const lower = headline.toLowerCase();

  if (titleCase) {
    const countries = COUNTRY_NAMES.filter((c) => new RegExp(`\\b${c.toLowerCase()}\\b`).test(lower)).slice(0, 2);
    // Acronyms (LNG, POW, IRGC) identify a story as well as a country does.
    const acronyms = [...new Set(words.filter((w) => /^[A-Z]{3,}$/.test(w)))].slice(0, 2);
    const used = new Set([...countries, ...acronyms].map((w) => w.toLowerCase()));
    const rest = [...new Set(long)]
      .filter((w) => !SKIP_WORDS.has(w) && !used.has(w.toLowerCase()) && !countries.some((c) => c.toLowerCase().includes(w.toLowerCase())))
      .sort((a, b) => b.length - a.length)
      .slice(0, Math.max(0, max - countries.length - acronyms.length));
    return [...countries, ...acronyms, ...rest].join(" ");
  }

  const proper = [...new Set(words.filter((w) => /^[A-Z]/.test(w) && !SKIP_WORDS.has(w)))];
  if (proper.length >= 2) return proper.slice(0, max).join(" ");
  return [...new Set(long.filter((w) => w.length > 4))].sort((a, b) => b.length - a.length).slice(0, 3).join(" ");
}

const day = (t: number) => new Date(t).toISOString().slice(0, 10);

export function buildQuery(headline: string, createdAt: string, maxTerms = 4): string {
  const t = new Date(createdAt).getTime();
  return `${headlineKeywords(headline, maxTerms)} after:${day(t - WINDOW_DAYS_BEFORE * 864e5)} before:${day(t + WINDOW_DAYS_AFTER * 864e5)}`;
}

export type BackfillSource = {
  url: string;
  title: string;
  domain: string;
  source_country: string | null;
  role: "primary" | "source";
};

export type Match = BackfillSource & { similarity: number };

// From raw search hits, pick the ones that are plausibly the same story as
// `headline`: close in time, sharing real words, from an outlet the story does
// not already cite. One per outlet, trimmed to `limit` with country spread.
export function matchHits(
  headline: string,
  createdAt: string,
  hits: NewsHit[],
  existingDomains: Set<string>,
  limit: number,
): Match[] {
  if (limit <= 0) return [];
  const center = new Date(createdAt).getTime();
  const lo = center - WINDOW_DAYS_BEFORE * 864e5;
  const hi = center + WINDOW_DAYS_AFTER * 864e5;
  const target = tokenize(headline);

  const scored = new Map<string, Match & { id: string; seen_date: string }>();
  for (const raw of hits) {
    const domain = canonicalDomain(raw.domain);
    if (!domain || isAggregator(domain) || existingDomains.has(domain)) continue;
    const h = { ...raw, domain };
    if (h.publishedAt) {
      const t = new Date(h.publishedAt).getTime();
      if (t < lo || t > hi) continue;
    }
    const tokens = tokenize(h.title);
    let shared = 0;
    for (const w of tokens) if (target.has(w)) shared++;
    const similarity = jaccard(target, tokens);
    if (shared < MIN_SHARED_WORDS || similarity < MIN_SIMILARITY) continue;

    const prev = scored.get(h.domain);
    if (prev && prev.similarity >= similarity) continue;
    scored.set(h.domain, {
      id: h.domain,
      seen_date: h.publishedAt ?? createdAt,
      url: h.url,
      title: h.title,
      domain: h.domain,
      source_country: countryForDomain(h.domain) || null,
      role: "source",
      similarity: Math.round(similarity * 100) / 100,
    });
  }

  const ranked = [...scored.values()].sort((a, b) => b.similarity - a.similarity);
  const asCandidates: (Candidate & Match)[] = ranked.map((m) => ({ ...m, id: m.domain, seen_date: m.seen_date }));
  return pickSources(asCandidates, Math.min(limit, MAX_SOURCES_FOR_STORY)).map(
    ({ url, title, domain, source_country, role, similarity }) => ({ url, title, domain, source_country, role, similarity }),
  );
}

// Country -> article count over a story's sources; the Off-Lens bar's
// "ingested sources" layer. Unknown countries are left out.
export function countryCounts(sources: { source_country: string | null }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sources) {
    if (s.source_country) counts[s.source_country] = (counts[s.source_country] ?? 0) + 1;
  }
  return counts;
}
