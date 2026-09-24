// Fetches a stock photo from Pexels, scored 0-100 and deduplicated against
// recently-used images (via image_usage_log) so the same photo doesn't
// repeat across unrelated stories.

const CATEGORY_SEARCH_TERMS: Record<string, string> = {
  "Trade & Tariffs": "cargo ship shipping",
  "Security & Conflict": "military",
  "Political": "government building",
  "Resources": "oil energy",
  "Tech & Regulation": "technology data center",
};

// Categories where a flag/emblem photo reads as on-topic rather than as
// filler -- everywhere else a flag is as generic as a globe or a handshake.
const DIPLOMATIC_CATEGORIES = new Set(["Political"]);
const DIPLOMATIC_CONTEXT_TERMS = [
  "united nations", "un security council", "summit", "diplomat", "diplomatic",
  "treaty", "embassy", "bilateral", "g7", "g20", "nato", "foreign minister",
  "state visit", "ambassador",
];
const FLAG_TERMS = ["flag", "flags", "emblem", "coat of arms"];

// Stock-photo filler that shows up for almost any geopolitics query
// regardless of relevance -- excluded unless the photo is a flag/emblem in
// a diplomatic context (see isDiplomaticContext).
const GENERIC_STOCK_TERMS = [
  "handshake", "shaking hands", "hand shake", "globe", "world globe",
  "businessman", "businessmen", "business meeting", "boardroom",
  "meeting room", "conference room", "cityscape", "skyline", "office building",
  "suit and tie", "men in suits",
];

const KNOWN_COUNTRIES = [
  "United States", "China", "Russia", "India", "Japan", "Germany", "France",
  "United Kingdom", "Canada", "Mexico", "Brazil", "Iran", "Israel", "Saudi Arabia",
  "Turkey", "Pakistan", "Bangladesh", "Indonesia", "Philippines", "Vietnam",
  "South Korea", "North Korea", "Taiwan", "Ukraine", "Poland", "Spain", "Italy",
  "Egypt", "Nigeria", "South Africa", "Venezuela", "Yemen", "Syria", "Iraq",
];

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "amid", "over",
]);

const CANDIDATE_POOL_SIZE = 15;
const MIN_SCORE_TO_ACCEPT = 35;
const HIGH_CONFIDENCE_SCORE = 70;
const RECENT_USE_EXCLUSION_DAYS = 30;

export function extractCountryFromHeadline(headline: string): string | null {
  for (const country of KNOWN_COUNTRIES) {
    if (headline.includes(country)) return country;
  }
  return null;
}

function extractKeywords(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

// Lightweight heuristic for "who this is actually about" beyond the
// country -- not real NER, just consecutive capitalized words in the
// headline (skipping the first, since that's capitalized regardless) that
// aren't a country or generic headline vocabulary.
const GENERIC_HEADLINE_WORDS = new Set([
  "trade", "war", "deal", "talks", "summit", "crisis", "week", "global",
  "world", "amid", "faces", "says", "report", "new",
]);

export function extractKeyActor(headline: string, country: string | null): string | null {
  const words = headline.split(/\s+/);
  const phrases: string[] = [];
  let current: string[] = [];

  for (let i = 1; i < words.length; i++) {
    const clean = words[i].replace(/[^A-Za-z]/g, "");
    if (clean.length > 1 && /^[A-Z]/.test(clean) && !GENERIC_HEADLINE_WORDS.has(clean.toLowerCase())) {
      current.push(clean);
    } else {
      if (current.length > 0) phrases.push(current.join(" "));
      current = [];
    }
  }
  if (current.length > 0) phrases.push(current.join(" "));

  const filtered = phrases.filter((p) => p !== country && !KNOWN_COUNTRIES.includes(p));
  return filtered[0] ?? null;
}

export function isDiplomaticContext(category: string, headline: string, body: string): boolean {
  if (DIPLOMATIC_CATEGORIES.has(category)) return true;
  const text = `${headline} ${body}`.toLowerCase();
  return DIPLOMATIC_CONTEXT_TERMS.some((t) => text.includes(t));
}

export function isGenericStock(altText: string, diplomatic: boolean): boolean {
  const alt = altText.toLowerCase();
  if (!alt) return false; // no description to judge -- don't penalize on missing metadata
  const isFlagOrEmblem = FLAG_TERMS.some((t) => alt.includes(t));
  if (diplomatic && isFlagOrEmblem) return false; // flags/symbols are on-topic here
  return GENERIC_STOCK_TERMS.some((t) => alt.includes(t));
}

type PexelsPhoto = {
  id: number;
  // large2x (~1880px wide) is what we actually use -- large (~940px) isn't
  // wide enough for our hero card at 2x device pixel ratio and ends up
  // visibly upscaled/soft on Retina displays.
  src: { large2x: string; large: string; medium: string };
  photographer: string;
  url: string;
  alt?: string;
};

async function getRecentlyUsedPexelsIds(): Promise<Set<string>> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const cutoff = new Date(Date.now() - RECENT_USE_EXCLUSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("image_usage_log")
      .select("external_id")
      .eq("source", "pexels")
      .gte("used_at", cutoff);
    return new Set((data ?? []).map((r) => r.external_id));
  } catch {
    return new Set();
  }
}

export async function logImageUsage(source: "pexels" | "wikimedia", externalId: string): Promise<void> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from("image_usage_log").insert({ source, external_id: externalId });
  } catch (err) {
    console.error("Failed to log image usage:", err);
  }
}

export type PexelsCandidate = {
  imageUrl: string;
  photographer: string;
  pexelsUrl: string;
  photoId: string;
  score: number;
};

export async function fetchImageForCategory(
  category: string,
  headline?: string,
  body?: string,
  subjectCountries?: string[],
  allowGenericFallback = false
): Promise<PexelsCandidate | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.error("Missing PEXELS_API_KEY env var.");
    return null;
  }

  const categoryTerm = CATEGORY_SEARCH_TERMS[category] ?? "world map";
  const country = subjectCountries?.[0] ?? (headline ? extractCountryFromHeadline(headline) : null);
  const keyActor = headline ? extractKeyActor(headline, country) : null;
  const diplomatic = isDiplomaticContext(category, headline ?? "", body ?? "");
  const query = [country, keyActor, categoryTerm].filter(Boolean).join(" ") || categoryTerm;
  const storyKeywords = extractKeywords(`${headline ?? ""} ${body ?? ""}`);

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${CANDIDATE_POOL_SIZE}&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) {
      console.error(`Pexels API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    let photos: PexelsPhoto[] = data?.photos ?? [];
    if (photos.length === 0 && (country || keyActor)) {
      // retry with just the category term -- the narrowed query found nothing
      return fetchImageForCategory(category, undefined, body, undefined, allowGenericFallback);
    }
    if (photos.length === 0) return null;

    const excludedIds = await getRecentlyUsedPexelsIds();
    photos = photos.filter((p) => !excludedIds.has(String(p.id)));

    // Filter out generic stock filler (handshakes, globes, boardrooms, ...)
    // unless the story is diplomatic/political/UN-related and the photo is
    // specifically a flag or emblem, which reads as on-topic there.
    if (!allowGenericFallback) {
      photos = photos.filter((p) => !isGenericStock(p.alt ?? "", diplomatic));
    }
    if (photos.length === 0) {
      if (!allowGenericFallback) {
        // narrowed search + blocklist left nothing -- widen once rather than
        // publish with no image at all
        return fetchImageForCategory(category, headline, body, subjectCountries, true);
      }
      return null;
    }

    const scored = photos.map((p) => {
      const altOverlap = p.alt ? [...extractKeywords(p.alt)].filter((w) => storyKeywords.has(w)).length : 0;
      const score =
        20 + // base: landscape + category match
        (country ? 25 : 10) + // country specificity
        (keyActor ? 10 : 0) + // named-actor specificity
        Math.min(altOverlap * 8, 25) + // keyword overlap with story
        15; // guaranteed fresh (not recently used)
      return { photo: p, score: Math.min(score, 100) };
    });

    scored.sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3).filter((s) => s.score >= MIN_SCORE_TO_ACCEPT);
    if (top3.length === 0) return null;

    // High confidence: weighted random among the top matches so repeated
    // categories don't always converge on the same photo. Low confidence:
    // no point adding randomness on top of an uncertain match -- take the
    // single highest-relevance candidate instead.
    let chosen = top3[0];
    if (top3[0].score >= HIGH_CONFIDENCE_SCORE) {
      const totalWeight = top3.reduce((sum, s) => sum + s.score, 0);
      let roll = Math.random() * totalWeight;
      for (const s of top3) {
        roll -= s.score;
        if (roll <= 0) {
          chosen = s;
          break;
        }
      }
    }

    return {
      imageUrl: chosen.photo.src.large2x ?? chosen.photo.src.large,
      photographer: chosen.photo.photographer,
      pexelsUrl: chosen.photo.url,
      photoId: String(chosen.photo.id),
      score: chosen.score,
    };
  } catch (err) {
    console.error("Pexels fetch failed:", err);
    return null;
  }
}
