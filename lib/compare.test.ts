import { describe, expect, it } from "vitest";
import { compareStories } from "./compare";
import type { Story } from "./stories";

const s = (slug: string) => ({ slug }) as Story;
describe("compareStories", () => {
  it("separates shared and unique stories", () => {
    const r = compareStories([s("1"), s("2")], [s("2"), s("3")]);
    expect(r.both.map((x) => x.slug)).toEqual(["2"]);
    expect(r.onlyA.map((x) => x.slug)).toEqual(["1"]);
    expect(r.onlyB.map((x) => x.slug)).toEqual(["3"]);
  });
});

import { overlapSentence, summarizeSide } from "./compare";
describe("summarizeSide / overlapSentence", () => {
  const now = Date.parse("2026-11-26T00:00:00Z");
  const st = (slug: string, iso: string, extra: Partial<Story> = {}) => ({ slug, publishedAt: iso, category: "Trade", ...extra }) as Story;
  it("summarizes counts, recency and quality", () => {
    const r = summarizeSide([st("a", "2026-11-20T00:00:00Z", { qualityScore: 80, status: "developing" }), st("b", "2026-08-01T00:00:00Z", { qualityScore: 60 })], now);
    expect(r.total).toBe(2);
    expect(r.last30).toBe(1);
    expect(r.developing).toBe(1);
    expect(r.avgQuality).toBe(70);
    expect(r.topCategories).toEqual([["Trade", 2]]);
  });
  it("handles empty", () => {
    expect(summarizeSide([], now).avgQuality).toBeNull();
    expect(overlapSentence("A", "B", { both: [], onlyA: [], onlyB: [] })).toContain("no stories");
  });
  it("describes overlap", () => {
    const x = st("1", "2026-11-01T00:00:00Z");
    expect(overlapSentence("A", "B", { both: [x], onlyA: [st("2", "2026-11-01T00:00:00Z")], onlyB: [] })).toContain("50% of our A");
  });
});
