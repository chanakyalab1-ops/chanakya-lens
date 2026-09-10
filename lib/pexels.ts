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
const RECENT_USE_EXCLUSION_DAYS = 30;

function extractCountryFromHeadline(headline: string): string | null {
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

type PexelsPhoto = {
  id: number;
  src: { large: string; medium: string };
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

export async function fetchImageForCategory(category: string, headline?: string, body?: string): Promise<PexelsCandidate | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.error("Missing PEXELS_API_KEY env var.");
    return null;
  }

  const categoryTerm = CATEGORY_SEARCH_TERMS[category] ?? "world map";
  const country = headline ? extractCountryFromHeadline(headline) : null;
  const query = country ? `${country} ${categoryTerm}` : categoryTerm;
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
    if (photos.length === 0 && country) {
      return fetchImageForCategory(category, undefined, body); // retry without country narrowing
    }
    if (photos.length === 0) return null;

    const excludedIds = await getRecentlyUsedPexelsIds();
    photos = photos.filter((p) => !excludedIds.has(String(p.id)));
    if (photos.length === 0) return null;

    const scored = photos.map((p) => {
      const altOverlap = p.alt ? [...extractKeywords(p.alt)].filter((w) => storyKeywords.has(w)).length : 0;
      const score =
        20 + // base: landscape + category match
        (country ? 25 : 10) + // country specificity
        Math.min(altOverlap * 8, 25) + // keyword overlap with story
        15; // guaranteed fresh (not recently used)
      return { photo: p, score: Math.min(score, 100) };
    });

    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5).filter((s) => s.score >= MIN_SCORE_TO_ACCEPT);
    if (top5.length === 0) return null;

    // Weighted random among the top candidates so repeated categories don't
    // always converge on the single highest-scored photo.
    const totalWeight = top5.reduce((sum, s) => sum + s.score, 0);
    let roll = Math.random() * totalWeight;
    let chosen = top5[0];
    for (const s of top5) {
      roll -= s.score;
      if (roll <= 0) {
        chosen = s;
        break;
      }
    }

    return {
      imageUrl: chosen.photo.src.large,
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
