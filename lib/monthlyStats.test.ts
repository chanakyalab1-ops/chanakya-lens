import { describe, expect, it } from "vitest";
import { currentPeriod, isValidPeriod, monthlyStats, periodLabel } from "./monthlyStats";
import { SYSTEMS } from "./lens";
import type { Story } from "./stories";

const kw = SYSTEMS[0].keywords[0];
const st = (slug: string, category: string, countries: string[], conf: string[], headline = slug): Story =>
  ({ slug, category, headline, dek: "", body: "", readTime: "1", publishedAt: "2026-11-10", subjectCountries: countries, impactNodes: conf.map((c) => ({ confidence: c, audience: "", mechanism: "" })) }) as unknown as Story;

describe("period helpers", () => {
  it("validates and formats", () => {
    expect(isValidPeriod("2026-11")).toBe(true);
    expect(isValidPeriod("2026-13")).toBe(false);
    expect(isValidPeriod("nov")).toBe(false);
    expect(currentPeriod(new Date("2026-11-30T12:00:00Z"))).toBe("2026-11");
    expect(periodLabel("2026-11")).toBe("November 2026");
  });
});

describe("monthlyStats", () => {
  const stories = [
    st("a", "Resources", ["Iran", "India"], ["direct", "likely"], `${kw} tanker`),
    st("b", "Resources", ["Iran"], ["possible"]),
    st("c", "Political", ["Peru"], []),
  ];
  const s = monthlyStats(stories, "2026-11");
  it("counts stories and countries", () => {
    expect(s.total).toBe(3);
    expect(s.countries[0]).toEqual({ name: "Iran", count: 2 });
  });
  it("tallies effects by category and certainty", () => {
    expect(s.effects[0]).toEqual({ category: "Resources", direct: 1, likely: 1, possible: 1 });
    expect(s.effects).toHaveLength(1);
  });
  it("counts chokepoint stories and ranks stories by direct effects", () => {
    expect(s.chokepoints[0].count).toBe(1);
    expect(s.topStories[0].slug).toBe("a");
  });
  it("lists every region and only names a least-covered one with enough stories", () => {
    expect(s.regions.map((r) => r.name)).toContain("Africa");
    expect(s.leastCovered).toBeNull();
  });
});
