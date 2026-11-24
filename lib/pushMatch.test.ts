import { describe, expect, it } from "vitest";
import { buildPayload, canSendToday, isBreaking, matchesPrefs, nextCounter, validatePrefs, type PushStory } from "./pushMatch";

const story = (extra: Partial<PushStory> = {}): PushStory => ({
  slug: "hormuz-tanker", headline: "Iran Claims Supertanker Sank in Hormuz After Mine Strike", dek: "Tehran says a mine hit the vessel.", category: "Resources",
  status: "developing", impactNodes: [{ confidence: "direct" }], subjectCountries: ["Iran"], ...extra,
});

describe("matchesPrefs", () => {
  it("sends the biggest stories to readers who asked for them", () => {
    expect(matchesPrefs(story(), { breakingOnly: true, topics: [] })).toBe(true);
    expect(matchesPrefs(story({ status: "settled" }), { breakingOnly: true, topics: [] })).toBe(false);
    expect(matchesPrefs(story({ impactNodes: [{ confidence: "likely" }] }), { breakingOnly: true, topics: [] })).toBe(false);
  });
  it("matches a chosen category", () => {
    expect(matchesPrefs(story({ status: "settled" }), { breakingOnly: false, topics: [{ kind: "category", slug: "Resources" }] })).toBe(true);
    expect(matchesPrefs(story(), { breakingOnly: false, topics: [{ kind: "category", slug: "Political" }] })).toBe(false);
  });
  it("matches a Lens page by its keywords", () => {
    expect(matchesPrefs(story(), { breakingOnly: false, topics: [{ kind: "lens", slug: "strait-of-hormuz" }] })).toBe(true);
    expect(matchesPrefs(story({ headline: "Peru cabinet reshuffle", dek: "", subjectCountries: ["Peru"] }), { breakingOnly: false, topics: [{ kind: "lens", slug: "strait-of-hormuz" }] })).toBe(false);
  });
  it("sends nothing when nothing is chosen", () => {
    expect(matchesPrefs(story(), { breakingOnly: false, topics: [] })).toBe(false);
  });
  it("counts breaking correctly", () => {
    expect(isBreaking(story())).toBe(true);
    expect(isBreaking(story({ impactNodes: null }))).toBe(false);
  });
});

describe("validatePrefs", () => {
  it("accepts good preferences", () => {
    expect(validatePrefs({ breakingOnly: true, topics: [{ kind: "category", slug: "Political" }, { kind: "lens", slug: "strait-of-hormuz" }] })).toEqual({
      breakingOnly: true, topics: [{ kind: "category", slug: "Political" }, { kind: "lens", slug: "strait-of-hormuz" }],
    });
  });
  it("rejects unknown topics and bad shapes", () => {
    expect(validatePrefs({ breakingOnly: true, topics: [{ kind: "category", slug: "Nope" }] })).toBeNull();
    expect(validatePrefs({ breakingOnly: true, topics: [{ kind: "lens", slug: "nope" }] })).toBeNull();
    expect(validatePrefs({ topics: "x" })).toBeNull();
    expect(validatePrefs(null)).toBeNull();
  });
});

describe("daily cap", () => {
  const now = new Date("2026-11-23T10:00:00Z").getTime();
  it("allows up to three a day, then resets the next day", () => {
    expect(canSendToday({ sent_day: "2026-11-23", sent_today: 2 }, now)).toBe(true);
    expect(canSendToday({ sent_day: "2026-11-23", sent_today: 3 }, now)).toBe(false);
    expect(canSendToday({ sent_day: "2026-11-22", sent_today: 3 }, now)).toBe(true);
    expect(canSendToday({ sent_day: null, sent_today: null }, now)).toBe(true);
  });
  it("counts what was sent", () => {
    expect(nextCounter({ sent_day: "2026-11-23", sent_today: 1 }, now)).toEqual({ sent_day: "2026-11-23", sent_today: 2 });
    expect(nextCounter({ sent_day: "2026-11-20", sent_today: 3 }, now)).toEqual({ sent_day: "2026-11-23", sent_today: 1 });
  });
});

describe("buildPayload", () => {
  it("links to the story and clips long text", () => {
    const p = buildPayload(story({ headline: "x".repeat(200) }), "new");
    expect(p.url).toBe("/story/hormuz-tanker");
    expect(p.title.length).toBeLessThanOrEqual(90);
  });
  it("marks updates", () => {
    expect(buildPayload(story(), "update").title.startsWith("Update: ")).toBe(true);
  });
});
