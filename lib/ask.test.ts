import { describe, expect, it } from "vitest";
import { buildAskPrompt, citedSlugs, cleanQuestion, pickRelevant, QUESTION_MAX } from "./ask";

const stories = [
  { slug: "hormuz-oil", headline: "Tanker traffic through Hormuz slows", dek: "Oil exports delayed", category: "Resources" },
  { slug: "peru-cabinet", headline: "Peru reshuffles its cabinet", dek: "New ministers sworn in", category: "Political" },
];

describe("pickRelevant", () => {
  it("returns stories sharing words with the question", () => {
    expect(pickRelevant("What is happening with Hormuz oil?", stories).map((s) => s.slug)).toEqual(["hormuz-oil"]);
  });
  it("returns nothing for an unrelated question", () => {
    expect(pickRelevant("How do I bake bread", stories)).toEqual([]);
  });
});

describe("citations", () => {
  it("keeps only provided slugs, once each", () => {
    expect(citedSlugs("Slowed [hormuz-oil] and again [hormuz-oil] but [made-up].", stories)).toEqual(["hormuz-oil"]);
  });
});

describe("helpers", () => {
  it("cleans and limits the question", () => {
    expect(cleanQuestion("  a \n b ")).toBe("a b");
    expect(cleanQuestion("x".repeat(1000))).toHaveLength(QUESTION_MAX);
  });
  it("builds a prompt that forbids outside knowledge", () => {
    expect(buildAskPrompt("q", stories).system).toContain("ONLY");
  });
});

import { askBlocked, askLimitsFor } from "./ask";

describe("askBlocked", () => {
  it("gives members 5 a day and free readers 1", () => {
    expect(askLimitsFor("member").perUser).toBe(5);
    expect(askLimitsFor("free").perUser).toBe(1);
  });
  it("stops a reader at their own limit", () => {
    expect(askBlocked({ tier: "free", usedByUser: 1, usedSiteWide: 0 })).toBe("user");
    expect(askBlocked({ tier: "member", usedByUser: 4, usedSiteWide: 0 })).toBeNull();
  });
  it("keeps the last slots of the daily cap for members", () => {
    expect(askBlocked({ tier: "free", usedByUser: 0, usedSiteWide: 100 })).toBe("busy");
    expect(askBlocked({ tier: "member", usedByUser: 0, usedSiteWide: 100 })).toBeNull();
    expect(askBlocked({ tier: "member", usedByUser: 0, usedSiteWide: 150 })).toBe("busy");
  });
});
