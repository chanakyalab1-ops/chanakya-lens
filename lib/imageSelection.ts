import { fetchImageForEntity } from "./wikimedia";
import { fetchImageForCategory, logImageUsage } from "./pexels";
import { fetchSourceOgImage } from "./ogImage";
import { TRUSTED_DOMAINS } from "./trustedDomains";
import { tokenize } from "./clustering";

const MIN_ACCEPTABLE_SCORE = 35;
const MAX_SOURCE_PHOTOS_TO_TRY = 4;

export type ImageSource = { url: string; domain: string; title?: string | null };

const MIN_SHARED_WORDS = 2;

// A cluster can hold loosely related articles, and an outlet's lead photo is
// whatever it ran on that page. Only take a photo from a source whose own title
// shares wording with this story, so a stray article cannot supply the picture.
export function sourcesAboutStory(headline: string, body: string, sources: ImageSource[]): ImageSource[] {
  const story = tokenize(`${headline} ${body}`);
  return sources.filter((s) => {
    if (!s.title) return true;
    let shared = 0;
    for (const t of tokenize(s.title)) if (story.has(t)) shared++;
    return shared >= MIN_SHARED_WORDS;
  });
}

export async function selectImageForStory(
  headline: string,
  body: string,
  category: string,
  subjectCountries?: string[],
  sources?: ImageSource[]
): Promise<{ imageUrl: string } | null> {
  // The actual event photo from one of the story's own sources beats any
  // stock/entity photo -- try trusted-wire sources first (most likely to
  // have the real, high-quality event photo), then whatever's left, and
  // only fall back to stock if none of them have a usable image. "Primary"
  // in the articles list is often just whichever article clustered first,
  // not necessarily the best-sourced one, so we don't rely on it alone.
  const relevant = sources ? sourcesAboutStory(headline, body, sources) : [];
  if (relevant.length > 0) {
    const ordered = [...relevant].sort((a, b) => {
      const aTrusted = TRUSTED_DOMAINS.has(a.domain) ? 0 : 1;
      const bTrusted = TRUSTED_DOMAINS.has(b.domain) ? 0 : 1;
      return aTrusted - bTrusted;
    });
    for (const source of ordered.slice(0, MAX_SOURCE_PHOTOS_TO_TRY)) {
      const ogImage = await fetchSourceOgImage(source.url);
      if (ogImage) return { imageUrl: ogImage };
    }
  }

  const [wiki, pexels] = await Promise.all([
    fetchImageForEntity(headline, body),
    fetchImageForCategory(category, headline, body, subjectCountries),
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
