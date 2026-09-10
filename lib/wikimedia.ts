// Fetches a specific, real, public-domain/CC0 image from Wikimedia Commons
// when a story is about a named, recognizable place or entity (a strait,
// a country, a city). Falls back to null (caller should use Pexels) when
// no specific entity is found or no suitably-licensed image exists.
// Docs: https://www.mediawiki.org/wiki/API:Search

// Known geopolitical entities worth a specific image search. Extend this
// list as new recurring places show up in your stories.
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
];

const ACCEPTABLE_LICENSES = ["Public domain", "CC0", "CC0 1.0"];
const MIN_WIDTH = 1600;
const MIN_HEIGHT = 900;

function extractPrimaryEntity(headline: string, body: string): string | null {
  const text = `${headline} ${body}`;
  for (const entity of KNOWN_ENTITIES) {
    if (text.includes(entity)) return entity;
  }
  return null;
}

type WikimediaSearchResult = {
  title: string;
};

type WikimediaImageInfo = {
  url: string;
  width: number;
  height: number;
  extmetadata?: {
    LicenseShortName?: { value: string };
    Artist?: { value: string };
  };
};

async function searchWikimedia(query: string): Promise<string | null> {
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&srnamespace=6&format=json&origin=*`;

  const res = await fetch(searchUrl);
  if (!res.ok) return null;

  const data = await res.json();
  const results: WikimediaSearchResult[] = data?.query?.search ?? [];
  if (results.length === 0) return null;

  return results[0].title;
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
  const info = page?.imageinfo?.[0];

  if (!info) return null;

  return info;
}

export async function fetchImageForEntity(headline: string, body: string): Promise<{
  imageUrl: string;
  photographer: string;
  sourceUrl: string;
  license: string;
} | null> {
  const entity = extractPrimaryEntity(headline, body);
  if (!entity) return null;

  try {
    const queries = [entity, `${entity} map`, `${entity} satellite`];

    for (const query of queries) {
      const fileTitle = await searchWikimedia(query);
      if (!fileTitle) continue;

      const info = await getImageInfo(fileTitle);
      if (!info) continue;

      const license = info.extmetadata?.LicenseShortName?.value ?? "Unknown";
      const isAcceptableLicense = ACCEPTABLE_LICENSES.some((l) =>
        license.toLowerCase().includes(l.toLowerCase())
      );

      const meetsQuality = info.width >= MIN_WIDTH && info.height >= MIN_HEIGHT && info.width > info.height;

      if (isAcceptableLicense && meetsQuality) {
        return {
          imageUrl: info.url,
          photographer: info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, "") ?? "Wikimedia Commons",
          sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle)}`,
          license,
        };
      }
    }

    return null;
  } catch (err) {
    console.error("Wikimedia fetch failed:", err);
    return null;
  }
}
