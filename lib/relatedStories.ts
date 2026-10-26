import { jaccard, tokenize } from "./clustering";
import type { Story } from "./stories";

type Linkable = Pick<Story, "slug" | "category" | "headline" | "dek" | "subjectCountries" | "publishedAt">;

// Same-topic stories first (shared headline/dek wording, which catches earlier
// and later developments of one running story), then same category and country.
// Gives each story page stronger internal links than "latest in the category".
export function relatedStories<T extends Linkable>(story: Linkable, all: T[], limit = 3): T[] {
  const mine = tokenize(`${story.headline} ${story.dek ?? ""}`);
  return all
    .filter((s) => s.slug !== story.slug)
    .map((s) => {
      const topic = jaccard(mine, tokenize(`${s.headline} ${s.dek ?? ""}`));
      const score =
        (topic >= 0.12 ? 4 + topic * 10 : 0) +
        (s.category === story.category ? 2 : 0) +
        (s.subjectCountries?.some((c) => story.subjectCountries?.includes(c)) ? 1 : 0);
      return { story: s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.story.publishedAt).getTime() - new Date(a.story.publishedAt).getTime())
    .slice(0, limit)
    .map((x) => x.story);
}
