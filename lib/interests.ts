import type { Story } from "./stories";
import { getLensEntity, storiesFor } from "./lens";

export type InterestKind = "category" | "lens";
export type Interest = { kind: InterestKind; slug: string };

// A reader follows a story category, or any Lens page (a country, a strategic
// system like the Strait of Hormuz, an actor or a theme). Lens slugs come from lib/lens.
export const CATEGORY_OPTIONS = ["Security & Conflict", "Trade & Tariffs", "Political", "Tech & Regulation", "Resources"];

export const FREE_INTEREST_LIMIT = 3;

export function interestLabel(i: Interest): string {
  return i.kind === "category" ? i.slug : getLensEntity(i.slug)?.name ?? i.slug;
}

export function isValidInterest(i: Interest): boolean {
  if (i.kind === "category") return CATEGORY_OPTIONS.includes(i.slug);
  if (i.kind === "lens") return !!getLensEntity(i.slug);
  return false;
}

// Stories matching any followed interest, newest first, each listed once.
export function matchInterests(stories: Story[], interests: Interest[]): Story[] {
  const seen = new Set<string>();
  const out: Story[] = [];
  const add = (list: Story[]) => {
    for (const s of list) {
      if (!seen.has(s.slug)) {
        seen.add(s.slug);
        out.push(s);
      }
    }
  };
  for (const i of interests) {
    if (i.kind === "category") add(stories.filter((s) => s.category === i.slug));
    else {
      const entity = getLensEntity(i.slug);
      if (entity) add(storiesFor(entity, stories));
    }
  }
  return out.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// The free limit only applies once membership is open to the public; until then
// nobody is asked to pay for something that cannot be bought.
export function canAddInterest(currentCount: number, opts: { isMember: boolean; membershipPublic: boolean }): boolean {
  if (!opts.membershipPublic || opts.isMember) return true;
  return currentCount < FREE_INTEREST_LIMIT;
}
