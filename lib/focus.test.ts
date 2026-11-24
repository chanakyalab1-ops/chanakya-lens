import { describe, expect, it } from "vitest";
import { applyFocus, countryOptions, NO_FOCUS } from "./focus";
import type { Story } from "./stories";

const st = (slug: string, countries: string[], conf: string[]): Story =>
  ({ slug, category: "Political", headline: slug, dek: "", body: "", readTime: "1", publishedAt: "2026-11-20", subjectCountries: countries, impactNodes: conf.map((c) => ({ confidence: c })) }) as unknown as Story;

const list = [st("a", ["Iran"], ["direct"]), st("b", ["Peru", "Iran"], ["possible"]), st("c", [], [])];

describe("applyFocus", () => {
  it("keeps everything with no focus", () => {
    expect(applyFocus(list, NO_FOCUS, new Set()).map((s) => s.slug)).toEqual(["a", "b", "c"]);
  });
  it("filters by confidence and country", () => {
    expect(applyFocus(list, { ...NO_FOCUS, confidence: "direct" }, new Set()).map((s) => s.slug)).toEqual(["a"]);
    expect(applyFocus(list, { ...NO_FOCUS, country: "Iran" }, new Set()).map((s) => s.slug)).toEqual(["a", "b"]);
  });
  it("hides read stories when fresh only", () => {
    expect(applyFocus(list, { ...NO_FOCUS, freshOnly: true }, new Set(["a"])).map((s) => s.slug)).toEqual(["b", "c"]);
  });
});

describe("countryOptions", () => {
  it("orders by how often a country appears", () => {
    expect(countryOptions(list)).toEqual(["Iran", "Peru"]);
  });
});
