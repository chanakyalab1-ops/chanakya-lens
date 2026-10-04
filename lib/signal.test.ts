import { describe, expect, it } from "vitest";
import { pickTodaysSignal, recentWindow } from "./signal";
import type { Story } from "./stories";

// 2026-10-02 10:00 IST = 04:30 UTC
const NOW = new Date("2026-10-02T04:30:00Z").getTime();
const story = (slug: string, publishedAt: string, extra: Partial<Story> = {}): Story =>
  ({ slug, headline: slug, dek: "", category: "x", publishedAt, ...extra }) as Story;

describe("recentWindow", () => {
  it("covers the last 24 hours, newest first, when there are at least 3 new stories", () => {
    const stories = [
      story("old", "2026-09-30T20:00:00Z"), // 32h ago
      story("a", "2026-10-01T10:00:00Z"),
      story("b", "2026-10-01T20:00:00Z"),
      story("c", "2026-10-02T04:00:00Z"),
    ];
    const w = recentWindow(stories, NOW);
    expect(w.stories.map((s) => s.slug)).toEqual(["c", "b", "a"]);
    expect(w.hours).toBe(24);
    expect(w.label).toBe("last 24 hours");
  });
  it("widens to 48 hours on a quiet stretch", () => {
    const stories = [story("a", "2026-10-01T02:00:00Z"), story("b", "2026-09-30T12:00:00Z"), story("old", "2026-09-28T00:00:00Z")];
    const w = recentWindow(stories, NOW);
    expect(w.stories.map((s) => s.slug)).toEqual(["a", "b"]);
    expect(w.hours).toBe(48);
    expect(w.label).toBe("last 2 days");
  });
  it("does not reset at midnight in any timezone", () => {
    // A batch published 04:17 UTC stays in the window 20 hours later, past midnight IST.
    const batch = ["a", "b", "c"].map((x) => story(x, "2026-10-03T04:17:00Z"));
    const later = new Date("2026-10-04T00:20:00Z").getTime();
    expect(recentWindow(batch, later).stories).toHaveLength(3);
  });
  it("is empty when nothing is recent", () => {
    expect(recentWindow([story("old", "2026-09-20T00:00:00Z")], NOW).stories).toEqual([]);
  });
});

describe("pickTodaysSignal", () => {
  it("prefers developing stories with a direct impact, then recency", () => {
    const direct = { impactNodes: [{ audience: "a", mechanism: "m", confidence: "direct" as const }] };
    const stories = [
      story("settled", "2026-10-02T03:00:00Z", { status: "settled" }),
      story("developing-direct", "2026-10-02T01:00:00Z", { status: "developing", ...direct }),
      story("developing", "2026-10-02T02:00:00Z", { status: "developing" }),
      story("settled-newer", "2026-10-02T04:00:00Z", { status: "settled" }),
    ];
    expect(pickTodaysSignal(stories, NOW).map((s) => s.slug)).toEqual(["developing-direct", "developing", "settled-newer"]);
  });
  it("falls back to the last 48 hours on a quiet day", () => {
    const stories = [story("a", "2026-10-01T06:00:00Z"), story("b", "2026-09-30T12:00:00Z")];
    expect(pickTodaysSignal(stories, NOW)).toHaveLength(2);
  });
});
