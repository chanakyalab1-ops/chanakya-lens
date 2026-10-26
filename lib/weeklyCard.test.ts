import { describe, expect, it } from "vitest";
import { clip, pickWeekly } from "./weeklyCard";
import type { WeeklyItem } from "./stories";

const mk = (slug: string, category: string, status: string | null = null, hasDirect = false): WeeklyItem => ({ slug, headline: slug, category, status, hasDirect });

describe("pickWeekly", () => {
  it("prefers developing/direct stories and spreads categories", () => {
    const items = [mk("a", "Economy"), mk("b", "Economy", "developing", true), mk("c", "Defense"), mk("d", "Economy", "developing")];
    expect(pickWeekly(items, 3).map((s) => s.slug)).toEqual(["b", "c", "d"]);
  });
  it("fills up to the limit and handles few stories", () => {
    expect(pickWeekly([mk("a", "X"), mk("b", "X")], 5)).toHaveLength(2);
  });
});

describe("clip", () => {
  it("shortens long text", () => {
    expect(clip("abcdefghij", 5)).toBe("abcd…");
    expect(clip("abc", 5)).toBe("abc");
  });
});
