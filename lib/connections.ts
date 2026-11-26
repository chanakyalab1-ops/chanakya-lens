import { hubsForStory, storiesFor } from "./lens";
import type { Story } from "./stories";

export type Connection = { entity: { slug: string; name: string }; stories: { slug: string; headline: string; category: string }[] };

// "Connected through": for each Lens page this story sits on, the other recent
// stories on the same page, so a reader can follow one thread across stories
// (a chokepoint, an actor, a theme). Groups with nothing else to show are dropped.
export function connectionsFor(story: Story, all: Story[], opts: { groups?: number; perGroup?: number } = {}): Connection[] {
  const { groups = 3, perGroup = 3 } = opts;
  const others = all.filter((s) => s.slug !== story.slug);
  const hubs = hubsForStory(story, all, 6);
  const out: Connection[] = [];
  for (const entity of hubs) {
    const list = storiesFor(entity, others)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, perGroup)
      .map((s) => ({ slug: s.slug, headline: s.headline, category: s.category }));
    if (list.length > 0) out.push({ entity: { slug: entity.slug, name: entity.name }, stories: list });
  }
  return out.slice(0, groups);
}

