// Fetches a single relevant, royalty-free stock photo per story via Pexels.
// Docs: https://www.pexels.com/api/documentation/

const CATEGORY_SEARCH_TERMS: Record<string, string> = {
  "Trade & Tariffs": "cargo ship shipping",
  "Security & Conflict": "military",
  "Political": "government building",
  "Resources": "oil energy",
  "Tech & Regulation": "technology data center",
};

type PexelsPhoto = {
  src: { large: string; medium: string };
  photographer: string;
  url: string;
};

export async function fetchImageForCategory(category: string): Promise<{
  imageUrl: string;
  photographer: string;
  pexelsUrl: string;
} | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.error("Missing PEXELS_API_KEY env var.");
    return null;
  }

  const query = CATEGORY_SEARCH_TERMS[category] ?? "world map";

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) {
      console.error(`Pexels API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const photo: PexelsPhoto | undefined = data?.photos?.[0];

    if (!photo) return null;

    return {
      imageUrl: photo.src.large,
      photographer: photo.photographer,
      pexelsUrl: photo.url,
    };
  } catch (err) {
    console.error("Pexels fetch failed:", err);
    return null;
  }
}
