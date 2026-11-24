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
