import { describe, expect, it } from "vitest";
import { ALL_ENTITIES, COUNTRIES, getLensEntity, matchesKeyword, storiesFor, coverageCounts, countriesByRegion, weeklyCounts, SYSTEMS } from "./lens";
import type { Story } from "./stories";

const story = (slug: string, headline: string, extra: Partial<Story> = {}): Story =>
  ({ slug, headline, dek: "", category: "x", publishedAt: "2026-10-01T00:00:00Z", ...extra }) as Story;

describe("registry", () => {
  it("has unique slugs and every related link resolves", () => {
    const slugs = ALL_ENTITIES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const e of ALL_ENTITIES) for (const r of e.related ?? []) expect(getLensEntity(r), `${e.slug} -> ${r}`).toBeTruthy();
  });
  it("lists the UAE once", () => {
    expect(COUNTRIES.filter((c) => c.name.includes("Emirates") || c.name === "UAE")).toHaveLength(1);
  });
});

describe("matchesKeyword", () => {
  it("matches whole words, ignoring case for longer keywords", () => {
    expect(matchesKeyword("Strait of HORMUZ reopens", "Hormuz")).toBe(true);
    expect(matchesKeyword("Hormuzi traders", "Hormuz")).toBe(false);
  });
  it("is case-sensitive for short keywords", () => {
    expect(matchesKeyword("US sanctions Iran", "US")).toBe(true);
    expect(matchesKeyword("Tell us more", "US")).toBe(false);
    expect(matchesKeyword("Dispute over EU tariffs", "EU")).toBe(true);
  });
  it("handles punctuation in keywords", () => {
    expect(matchesKeyword("OPEC+ agrees cut", "OPEC+")).toBe(true);
    expect(matchesKeyword("U.S. to impose tariffs", "U.S.")).toBe(true);
  });
});

describe("storiesFor", () => {
  it("matches a system by keyword, newest first", () => {
    const stories = [
      story("a", "Hormuz traffic falls", { publishedAt: "2026-10-01T00:00:00Z" }),
      story("b", "Unrelated", {}),
      story("c", "Tanker seized near Hormuz", { publishedAt: "2026-10-02T00:00:00Z" }),
    ];
    expect(storiesFor(getLensEntity("strait-of-hormuz")!, stories).map((s) => s.slug)).toEqual(["c", "a"]);
  });
  it("matches a country on subject countries even when the headline doesn't name it", () => {
    const s = story("x", "Ceasefire talks resume", { subjectCountries: ["Iran"] });
    expect(storiesFor(getLensEntity("iran")!, [s])).toHaveLength(1);
  });
});

describe("coverageCounts", () => {
  it("counts sources per country, most first", () => {
    const sources = (...cs: string[]) => cs.map((c) => ({ url: "", title: "", domain: "", sourceCountry: c, role: "source" as const }));
    const stories = [story("a", "A", { sources: sources("India", "Qatar") }), story("b", "B", { sources: sources("India") })];
    expect(coverageCounts(stories)).toEqual([["India", 2], ["Qatar", 1]]);
  });
});

describe("countriesByRegion", () => {
  it("groups countries and leaves none out", () => {
    const total = countriesByRegion().reduce((n, g) => n + g.countries.length, 0);
    expect(total).toBe(COUNTRIES.length);
  });
});

describe("weeklyCounts", () => {
  it("counts only the past 7 days", () => {
    const now = new Date("2026-10-10T00:00:00Z").getTime();
    const stories = [
      story("a", "Hormuz closed", { publishedAt: "2026-10-09T00:00:00Z" }),
      story("b", "Hormuz reopens", { publishedAt: "2026-10-05T00:00:00Z" }),
      story("c", "Hormuz last month", { publishedAt: "2026-09-01T00:00:00Z" }),
    ];
    expect(weeklyCounts(SYSTEMS, stories, now)["strait-of-hormuz"]).toBe(2);
    expect(weeklyCounts(SYSTEMS, stories, now)["red-sea"]).toBe(0);
  });
});
