import { describe, expect, it } from "vitest";
import { canAddInterest, interestLabel, isValidInterest, matchInterests } from "./interests";
import type { Story } from "./stories";

const story = (slug: string, category: string, headline: string, at: string, countries: string[] = []): Story => ({
  slug, category, headline, dek: "", body: "", readTime: "3 min", publishedAt: at, subjectCountries: countries,
});

describe("matchInterests", () => {
  const stories = [
    story("a", "Resources", "Iran Claims Supertanker Sank in Hormuz After Mine Strike", "2026-11-20"),
    story("b", "Political", "Cabinet reshuffle in Peru", "2026-11-21", ["Peru"]),
    story("c", "Resources", "Gulf oil exports hold up", "2026-11-19"),
  ];
  it("matches categories, newest first", () => {
    expect(matchInterests(stories, [{ kind: "category", slug: "Resources" }]).map((s) => s.slug)).toEqual(["a", "c"]);
  });
  it("matches a country by subject country", () => {
    expect(matchInterests(stories, [{ kind: "lens", slug: "peru" }]).map((s) => s.slug)).toEqual(["b"]);
  });
  it("lists a story once across overlapping interests", () => {
    const out = matchInterests(stories, [{ kind: "category", slug: "Resources" }, { kind: "lens", slug: "strait-of-hormuz" }]);
    expect(out.filter((s) => s.slug === "a")).toHaveLength(1);
  });
  it("returns nothing for no interests", () => {
    expect(matchInterests(stories, [])).toEqual([]);
  });
});

describe("interest helpers", () => {
  it("validates kinds and slugs", () => {
    expect(isValidInterest({ kind: "category", slug: "Political" })).toBe(true);
    expect(isValidInterest({ kind: "category", slug: "Nonsense" })).toBe(false);
    expect(isValidInterest({ kind: "lens", slug: "strait-of-hormuz" })).toBe(true);
    expect(isValidInterest({ kind: "lens", slug: "nope" })).toBe(false);
  });
  it("labels interests", () => {
    expect(interestLabel({ kind: "category", slug: "Political" })).toBe("Political");
    expect(interestLabel({ kind: "lens", slug: "strait-of-hormuz" })).toBe("Strait of Hormuz");
  });
  it("applies the free limit only once membership is public", () => {
    expect(canAddInterest(10, { isMember: false, membershipPublic: false })).toBe(true);
    expect(canAddInterest(2, { isMember: false, membershipPublic: true })).toBe(true);
    expect(canAddInterest(3, { isMember: false, membershipPublic: true })).toBe(false);
    expect(canAddInterest(30, { isMember: true, membershipPublic: true })).toBe(true);
  });
});
