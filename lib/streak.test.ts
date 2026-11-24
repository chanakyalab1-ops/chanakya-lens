import { describe, expect, it } from "vitest";
import { readingStreak } from "./streak";

const now = Date.parse("2026-11-24T12:00:00Z");
describe("readingStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(readingStreak(["2026-11-24T08:00:00Z", "2026-11-23T20:00:00Z", "2026-11-22T01:00:00Z"], now)).toBe(3);
  });
  it("keeps the streak alive until the end of today", () => {
    expect(readingStreak(["2026-11-23T08:00:00Z", "2026-11-22T08:00:00Z"], now)).toBe(2);
  });
  it("breaks on a missed day and is zero with no reads", () => {
    expect(readingStreak(["2026-11-24T08:00:00Z", "2026-11-22T08:00:00Z"], now)).toBe(1);
    expect(readingStreak([], now)).toBe(0);
    expect(readingStreak(["2026-11-20T08:00:00Z"], now)).toBe(0);
  });
});
