import { describe, expect, it } from "vitest";
import { relatedStories } from "./relatedStories";

const mk = (slug: string, headline: string, category: string, at: string, countries: string[] = []) => ({
  slug, headline, dek: "", category, subjectCountries: countries, publishedAt: at,
});

describe("relatedStories", () => {
  const me = mk("me", "Iran enriches uranium after sanctions snap back", "Geopolitics", "2026-10-10", ["Iran"]);
  it("puts the same running story ahead of newer same-category stories", () => {
    const same = mk("same", "Iran uranium enrichment draws new sanctions", "Economy", "2026-10-01", ["Iran"]);
    const newer = mk("newer", "Cabinet reshuffle in Peru", "Geopolitics", "2026-10-12", ["Peru"]);
    expect(relatedStories(me, [newer, same], 2).map((s) => s.slug)).toEqual(["same", "newer"]);
  });
  it("excludes itself and unrelated stories", () => {
    const other = mk("o", "Cricket final in Dubai", "Sports", "2026-10-11");
    expect(relatedStories(me, [me, other])).toEqual([]);
  });
});
