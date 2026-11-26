import { describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ supabase: {} }));
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn }));

import { fitToBytes, toListStory, type Story } from "./stories";

describe("toListStory", () => {
  it("keeps only outlet, country and role for each source", () => {
    const story = {
      slug: "a",
      headline: "H",
      sources: [{ url: "https://x.com/a", title: "Long title", domain: "x.com", sourceCountry: "India", role: "primary" }],
    } as unknown as Story;
    expect(toListStory(story).sources).toEqual([{ url: "", title: "", domain: "x.com", sourceCountry: "India", role: "primary" }]);
  });
  it("leaves stories without sources alone", () => {
    expect(toListStory({ slug: "b" } as unknown as Story).sources).toBeUndefined();
  });
});

const big = (n: number): Story =>
  ({
    slug: `s${n}`,
    headline: `Headline ${n}`,
    dek: "dek",
    category: "Political",
    publishedAt: new Date(Date.UTC(2026, 0, 1) + n * 86_400_000).toISOString(),
    chanakyaAnalysis: "a".repeat(2000),
    offLens: "o".repeat(2000),
    impactNodes: [{ confidence: "direct", audience: "readers", mechanism: "m".repeat(400) }],
  }) as unknown as Story;

describe("list previews", () => {
  it("shortens long analysis, Off-Lens and mechanism text", () => {
    const s = toListStory(big(1));
    expect(s.chanakyaAnalysis!.length).toBeLessThanOrEqual(220);
    expect(s.offLens!.length).toBeLessThanOrEqual(600);
    expect(s.impactNodes![0].mechanism.length).toBeLessThanOrEqual(160);
    expect(s.impactNodes![0].audience).toBe("readers");
  });
});

describe("fitToBytes", () => {
  it("leaves a small list alone", () => {
    const list = [big(1), big(2)];
    expect(fitToBytes(list, 1_000_000)).toBe(list);
  });
  it("shortens text first, keeping every story", () => {
    const list = Array.from({ length: 60 }, (_, i) => toListStory(big(i)));
    const size = (v: unknown) => new TextEncoder().encode(JSON.stringify(v)).length;
    const limit = Math.floor(size(list) * 0.6);
    const out = fitToBytes(list, limit);
    expect(out).toHaveLength(60);
    expect(size(out)).toBeLessThanOrEqual(limit);
  });
  it("drops only the oldest stories as a last resort, and keeps the original order", () => {
    const list = Array.from({ length: 400 }, (_, i) => toListStory(big(i)));
    const size = (v: unknown) => new TextEncoder().encode(JSON.stringify(v)).length;
    const out = fitToBytes(list, 120_000);
    expect(out.length).toBeLessThan(400);
    expect(out.length).toBeGreaterThanOrEqual(150);
    expect(size(out)).toBeLessThanOrEqual(120_000);
    const kept = out.map((s) => s.slug);
    expect(kept).toContain("s399");
    expect(kept).not.toContain("s0");
    expect(kept).toEqual(list.filter((s) => kept.includes(s.slug)).map((s) => s.slug));
  });
});
