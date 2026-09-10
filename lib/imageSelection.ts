import { fetchImageForEntity } from "./wikimedia";
import { fetchImageForCategory, logImageUsage } from "./pexels";

const MIN_ACCEPTABLE_SCORE = 35;

export async function selectImageForStory(
  headline: string,
  body: string,
  category: string
): Promise<{ imageUrl: string } | null> {
  const [wiki, pexels] = await Promise.all([
    fetchImageForEntity(headline, body),
    fetchImageForCategory(category, headline, body),
  ]);

  const candidates = [
    wiki ? { source: "wikimedia" as const, externalId: wiki.sourceUrl, imageUrl: wiki.imageUrl, score: wiki.score } : null,
    pexels ? { source: "pexels" as const, externalId: pexels.photoId, imageUrl: pexels.imageUrl, score: pexels.score } : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const winner = candidates[0];

  if (winner.score < MIN_ACCEPTABLE_SCORE) return null; // no image beats a bad image

  await logImageUsage(winner.source, winner.externalId);

  return { imageUrl: winner.imageUrl };
}
