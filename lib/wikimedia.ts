// Fetches a real image from Wikimedia Commons for a named geopolitical
// entity, scored on a 0-100 editorial scale (relevance, keyword overlap,
// recency, image type, license) rather than accepted on first license+
// keyword match. Maps/satellite imagery are exempt from the recency
// penalty since borders/geography don't go stale the way event photos do.

const KNOWN_ENTITIES = [
  "Strait of Hormuz", "Strait of Malacca", "Bab al-Mandeb", "Taiwan Strait",
  "South China Sea", "Suez Canal", "Panama Canal", "Red Sea", "Ceuta",
  "Gaza Strip", "West Bank", "Kashmir", "Crimea", "Donbas", "Golan Heights",
  "Kaliningrad", "Nepal", "Ukraine", "Moscow", "Kyiv", "Beijing", "Taiwan",
  "Iran", "Israel", "Gaza", "Lebanon", "Saudi Arabia", "Yemen", "Venezuela",
  "Caracas", "China", "India", "Pakistan", "Bangladesh", "Indonesia",
  "Philippines", "North Korea", "South Korea", "Turkey", "Syria", "Iraq",
  "Egypt", "Morocco", "Spain", "European Union", "NATO", "United Nations",
  "White House", "Kremlin", "Pentagon",
];

const ACCEPTABLE_LICENSES = ["Public domain", "CC0", "CC0 1.0"];
const MIN_WIDTH = 1600;
const MIN_HEIGHT = 900;
const CANDIDATES_PER_QUERY = 5;
const MIN_SCORE_TO_WIN = 70;

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "be", "been",
  "has", "have", "had", "its", "their", "this", "that", "after", "over",
  "into", "amid", "says", "said", "new", "will", "could", "would",
]);

function extractPrimaryEntity(headline: string, body: string): { entity: string; inHeadline: boolean } | null {
  for (const entity of KNOWN_ENTITIES) {
    if (headline.includes(entity)) return { entity, inHeadline: true };
  }
  for (const entity of KNOWN_ENTITIES) {
    if (body.includes(entity)) return { entity, inHeadline: false };
  }
  return null;
}

function extractKeywords(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

function countKeywordMatches(storyKeywords: Set<string>, imageText: string): number {
  const imageKeywords = extractKeywords(imageText);
  let matches = 0;
  for (const word of imageKeywords) {
    if (storyKeywords.has(word)) matches++;
  }
  return matches;
}

function extractImageYear(info: WikimediaImageInfo): number | null {
  const dateStr =
    info.extmetadata?.DateTimeOriginal?.value ?? info.extmetadata?.DateTime?.value ?? "";
  const match = dateStr.match(/(1[89]\d{2}|20\d{2})/);
  return match ? parseInt(match[1], 10) : null;
}

function recencyScore(year: number | null, isMapType: boolean): number {
  if (year === null) return isMapType ? 15 : 10; // unknown date, moderate penalty
  const age = new Date().getFullYear() - year;
  const maxAge = isMapType ? 75 : 20; // maps get real leniency, not a total exemption
  if (age <= (isMapType ? 15 : 5)) return 20;
  if (age >= maxAge) return 0;
  return Math.max(0, Math.round(20 * (1 - age / maxAge)));
}

type WikimediaSearchResult = { title: string; snippet?: string };

type WikimediaImageInfo = {
  url: string;
  width: number;
  height: number;
  extmetadata?: {
    LicenseShortName?: { value: string };
    Artist?: { value: string };
    ImageDescription?: { value: string };
    ObjectName?: { value: string };
    DateTimeOriginal?: { value: string };
    DateTime?: { value: string };
  };
};

async function searchWikimedia(query: string): Promise<WikimediaSearchResult[]> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${CANDIDATES_PER_QUERY}&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.query?.search ?? [];
}

async function getImageInfo(fileTitle: string): Promise<WikimediaImageInfo | null> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0] as { imageinfo?: WikimediaImageInfo[] } | undefined;
  return page?.imageinfo?.[0] ?? null;
}

export type WikimediaCandidate = {
  imageUrl: string;
  photographer: string;
  sourceUrl: string;
  license: string;
  score: number;
};

export async function fetchImageForEntity(headline: string, body: string): Promise<WikimediaCandidate | null> {
  const found = extractPrimaryEntity(headline, body);
  if (!found) return null;
  const { entity, inHeadline } = found;
  const storyKeywords = extractKeywords(`${headline} ${body}`);

  let best: WikimediaCandidate | null = null;

  try {
    const queries: { q: string; isMapType: boolean }[] = [
      { q: `${entity} map`, isMapType: true },
      { q: `${entity} satellite`, isMapType: true },
      { q: entity, isMapType: false },
    ];

    for (const { q, isMapType } of queries) {
      const results = await searchWikimedia(q);

      for (const result of results) {
        const info = await getImageInfo(result.title);
        if (!info) continue;

        const license = info.extmetadata?.LicenseShortName?.value ?? "Unknown";
        const isAcceptableLicense = ACCEPTABLE_LICENSES.some((l) => license.toLowerCase().includes(l.toLowerCase()));
        const meetsQuality = info.width >= MIN_WIDTH && info.height >= MIN_HEIGHT && info.width > info.height;
        if (!isAcceptableLicense || !meetsQuality) continue;

        const imageText = [
          result.title, result.snippet ?? "",
          info.extmetadata?.ImageDescription?.value ?? "",
          info.extmetadata?.ObjectName?.value ?? "",
        ].join(" ").replace(/<[^>]*>/g, "");

        const matches = countKeywordMatches(storyKeywords, imageText);
        const year = extractImageYear(info);

        const relevanceScore = Math.min((inHeadline ? 30 : 20) + Math.min(matches, 2) * 5, 40);
        const keywordScore = Math.min(matches * 5, 20);
        const recency = recencyScore(year, isMapType);
        const typeScore = isMapType ? 10 : 5;
        const licenseScore = 10;

        const total = relevanceScore + keywordScore + recency + typeScore + licenseScore;

        if (total >= MIN_SCORE_TO_WIN && (!best || total > best.score)) {
          best = {
            imageUrl: info.url,
            photographer: info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, "") ?? "Wikimedia Commons",
            sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(result.title)}`,
            license,
            score: total,
          };
        }
      }

      if (best && isMapType) break; // a good map match is strong enough to stop early
    }

    return best;
  } catch (err) {
    console.error("Wikimedia fetch failed:", err);
    return best;
  }
}

