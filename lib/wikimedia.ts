// Fetches a specific, real, public-domain/CC0 image from Wikimedia Commons
// when a story is about a named, recognizable place or entity (a strait,
// a country, a city). Checks multiple candidates per query and scores each
// against the story's own text before accepting, rather than blindly
// taking the first search result. Falls back to null (caller should use
// Pexels) when no specific entity is found or no suitably-licensed,
// sufficiently-relevant image exists.
// Docs: https://www.mediawiki.org/wiki/API:Search

const KNOWN_ENTITIES = [
  "Strait of Hormuz",
  "Strait of Malacca",
  "Bab al-Mandeb",
  "Taiwan Strait",
  "South China Sea",
  "Suez Canal",
  "Panama Canal",
  "Red Sea",
  "Ceuta",
  "Gaza Strip",
  "West Bank",
  "Kashmir",
  "Crimea",
  "Donbas",
  "Golan Heights",
  "Kaliningrad",
  "Nepal",
  "Ukraine",
  "Moscow",
  "Kyiv",
  "Beijing",
  "Taiwan",
  "Iran",
  "Israel",
  "Gaza",
  "Lebanon",
  "Saudi Arabia",
  "Yemen",
  "Venezuela",
  "Caracas",
  "China",
  "India",
  "Pakistan",
  "Bangladesh",
  "Indonesia",
  "Philippines",
  "North Korea",
  "South Korea",
  "Turkey",
  "Syria",
  "Iraq",
  "Egypt",
  "Morocco",
  "Spain",
  "European Union",
  "NATO",
  "United Nations",
  "White House",
  "Kremlin",
  "Pentagon",
];

const ACCEPTABLE_LICENSES = ["Public domain", "CC0", "CC0 1.0"];
const MIN_WIDTH = 1600;
const MIN_HEIGHT = 900;
const CANDIDATES_PER_QUERY = 5;
const MIN_RELEVANCE_MATCHES = 1; // at least this many story keywords must appear in the image's own text

// Common words to ignore when comparing story text against image
// descriptions, so matches reflect real subject overlap, not filler words.
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "be", "been",
  "has", "have", "had", "its", "their", "this", "that", "after", "over",
  "into", "amid", "says", "said", "new", "will", "could", "would",
]);

function extractPrimaryEntity(headline: string, body: string): string | null {
  const text = `${headline} ${body}`;
  for (const entity of KNOWN_ENTITIES) {
    if (text.includes(entity)) return entity;
  }
  return null;
}

function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

function scoreRelevance(storyKeywords: Set<string>, imageText: string): number {
  const imageKeywords = extractKeywords(imageText);
  let matches = 0;
  for (const word of imageKeywords) {
    if (storyKeywords.has(word)) matches++;
  }
  return matches;
}

type WikimediaSearchResult = {
  title: string;
  snippet?: string;
};

type WikimediaImageInfo = {
  url: string;
  width: number;
  height: number;
  extmetadata?: {
    LicenseShortName?: { value: string };
    Artist?: { value: string };
    ImageDescription?: { value: string };
    ObjectName?: { value: string };
  };
};

async function searchWikimedia(query: string): Promise<WikimediaSearchResult[]> {
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&srnamespace=6&srlimit=${CANDIDATES_PER_QUERY}&format=json&origin=*`;

  const res = await fetch(searchUrl);
  if (!res.ok) return [];

  const data = await res.json();
  return data?.query?.search ?? [];
}

async function getImageInfo(fileTitle: string): Promise<WikimediaImageInfo | null> {
  const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    fileTitle
  )}&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`;

  const res = await fetch(infoUrl);
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0] as { imageinfo?: WikimediaImageInfo[] } | undefined;
  return page?.imageinfo?.[0] ?? null;
}

export async function fetchImageForEntity(headline: string, body: string): Promise<{
  imageUrl: string;
  photographer: string;
  sourceUrl: string;
  license: string;
} | null> {
  const entity = extractPrimaryEntity(headline, body);
  if (!entity) return null;

  const storyKeywords = extractKeywords(`${headline} ${body}`);

  try {
    // Map/satellite queries first -- inherently timeless and specific,
    // lower risk of pulling an unrelated or outdated photo.
    const queries = [`${entity} map`, `${entity} satellite`, entity];

    let best: { imageUrl: string; photographer: string; sourceUrl: string; license: string; score: number } | null = null;

    for (const query of queries) {
      const results = await searchWikimedia(query);

      for (const result of results) {
        const info = await getImageInfo(result.title);
        if (!info) continue;

        const license = info.extmetadata?.LicenseShortName?.value ?? "Unknown";
        const isAcceptableLicense = ACCEPTABLE_LICENSES.some((l) =>
          license.toLowerCase().includes(l.toLowerCase())
        );
        const meetsQuality = info.width >= MIN_WIDTH && info.height >= MIN_HEIGHT && info.width > info.height;

        if (!isAcceptableLicense || !meetsQuality) continue;

        // Combine the file title, snippet, and any embedded description/object
        // name to judge whether this specific image relates to the story.
        const imageText = [
          result.title,
          result.snippet ?? "",
          info.extmetadata?.ImageDescription?.value ?? "",
          info.extmetadata?.ObjectName?.value ?? "",
        ].join(" ").replace(/<[^>]*>/g, "");

        const score = scoreRelevance(storyKeywords, imageText);

        if (score >= MIN_RELEVANCE_MATCHES && (!best || score > best.score)) {
          best = {
            imageUrl: info.url,
            photographer: info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, "") ?? "Wikimedia Commons",
            sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(result.title)}`,
            license,
            score,
          };
        }
      }

      // A map/satellite hit is strong enough to stop early rather than
      // keep searching broader, riskier queries.
      if (best && query !== entity) break;
    }

    if (!best) return null;
    const { score: _score, ...result } = best;
    return result;
  } catch (err) {
    console.error("Wikimedia fetch failed:", err);
    return null;
  }
}
