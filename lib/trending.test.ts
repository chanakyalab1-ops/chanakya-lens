import { describe, expect, it } from "vitest";
import { trendingTopics } from "./trending";
import type { Story } from "./stories";

const NOW = new Date("2026-10-04T00:00:00Z").getTime();
const hoursAgo = (h: number) => new Date(NOW - h * 3600 * 1000).toISOString();
let n = 0;
const story = (headline: string, h: number, extra: Partial<Story> = {}): Story =>
  ({ slug: `s${n++}`, headline, dek: "", category: "x", publishedAt: hoursAgo(h), ...extra }) as Story;

describe("trendingTopics", () => {
  it("surfaces a topic with a burst of recent stories", () => {
    const stories = [
      story("Tanker seized near Hormuz", 2),
      story("Hormuz traffic halves", 5),
      story("Oil jumps as Hormuz tension builds", 9),
      story("Something unrelated", 3),
    ];
    const out = trendingTopics(stories, NOW);
    expect(out[0]).toMatchObject({ slug: "strait-of-hormuz", count: 3 });
  });

  it("needs at least two recent stories", () => {
    expect(trendingTopics([story("Hormuz alone", 2), story("Other", 3), story("More", 4)], NOW).map((t) => t.slug)).not.toContain("strait-of-hormuz");
  });

  it("ranks a surge above a topic that is always in the news", () => {
    // India has 3 stories today but ~4 a day all fortnight; Hormuz has 3 today and none before.
    const usual = Array.from({ length: 50 }, (_, i) => story("India budget talks", 30 + i * 6));
    const today = [
      story("India trade deal", 1), story("India inflation", 2), story("India rate cut", 3),
      story("Hormuz closed", 1), story("Hormuz reopens", 2), story("Hormuz talks", 3),
    ];
    const slugs = trendingTopics([...usual, ...today], NOW).map((t) => t.slug);
    expect(slugs.indexOf("strait-of-hormuz")).toBeLessThan(slugs.indexOf("india"));
  });

  it("returns nothing when no story is recent", () => {
    expect(trendingTopics([story("Hormuz old", 400), story("Hormuz older", 500)], NOW)).toEqual([]);
  });

  it("caps the list", () => {
    const stories = ["Iran", "India", "China", "Russia", "Israel"].flatMap((c) => [story(`${c} one`, 2), story(`${c} two`, 3)]);
    expect(trendingTopics(stories, NOW, 3)).toHaveLength(3);
  });
});
