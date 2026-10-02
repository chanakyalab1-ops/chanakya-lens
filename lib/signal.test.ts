import { describe, expect, it } from "vitest";
import { pickTodaysSignal, startOfTodayIST, storiesFromToday } from "./signal";
import type { Story } from "./stories";

// 2026-10-02 10:00 IST = 04:30 UTC
const NOW = new Date("2026-10-02T04:30:00Z").getTime();
const story = (slug: string, publishedAt: string, extra: Partial<Story> = {}): Story =>
  ({ slug, headline: slug, dek: "", category: "x", publishedAt, ...extra }) as Story;

describe("startOfTodayIST", () => {
  it("is midnight IST, which is 18:30 UTC the day before", () => {
    expect(new Date(startOfTodayIST(NOW)).toISOString()).toBe("2026-10-01T18:30:00.000Z");
  });
  it("rolls over at midnight IST, not midnight UTC", () => {
    const justBefore = new Date("2026-10-02T18:29:00Z").getTime(); // 23:59 IST on the 2nd
    const justAfter = new Date("2026-10-02T18:31:00Z").getTime(); // 00:01 IST on the 3rd
    expect(new Date(startOfTodayIST(justBefore)).toISOString()).toBe("2026-10-01T18:30:00.000Z");
    expect(new Date(startOfTodayIST(justAfter)).toISOString()).toBe("2026-10-02T18:30:00.000Z");
  });
});

describe("storiesFromToday", () => {
  it("keeps only stories since midnight IST, newest first", () => {
    const stories = [
      story("yesterday-late", "2026-10-01T18:00:00Z"), // 23:30 IST yesterday
      story("early", "2026-10-01T19:00:00Z"), // 00:30 IST today
      story("latest", "2026-10-02T04:00:00Z"),
    ];
    expect(storiesFromToday(stories, NOW).map((s) => s.slug)).toEqual(["latest", "early"]);
  });
  it("is empty when nothing has been published yet today", () => {
    expect(storiesFromToday([story("old", "2026-09-30T00:00:00Z")], NOW)).toEqual([]);
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
