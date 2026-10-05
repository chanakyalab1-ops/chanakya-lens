import { describe, expect, it } from "vitest";
import { paragraphs } from "./paragraphs";
import { groupSources } from "./groupSources";

describe("paragraphs", () => {
  it("keeps the body's own paragraph breaks", () => {
    expect(paragraphs("First para.\n\nSecond para.\n\n\nThird.")).toEqual(["First para.", "Second para.", "Third."]);
  });
  it("leaves a short single block alone", () => {
    expect(paragraphs("One short block. Two sentences.")).toEqual(["One short block. Two sentences."]);
  });
  it("splits a long block at sentence ends without losing text", () => {
    const sentence = "The company said it will raise prices in the US and Europe next quarter.";
    const body = Array.from({ length: 12 }, () => sentence).join(" ");
    const out = paragraphs(body);
    expect(out.length).toBeGreaterThanOrEqual(2);
    expect(out.every((p) => p.length <= 700)).toBe(true);
    expect(out.join(" ")).toBe(body);
  });
  it("does not split after an abbreviation like U.S.", () => {
    const body = ("The U.S. Treasury said the measure would take effect in May. " + "x".repeat(0)).repeat(12).trim();
    expect(paragraphs(body).every((p) => !/\bU\.S\.$/.test(p))).toBe(true);
  });
  it("returns nothing for an empty body", () => {
    expect(paragraphs("  ")).toEqual([]);
  });
});

describe("groupSources", () => {
  const s = (title: string, domain: string, url = `https://${domain}/a`, sourceCountry: string | null = "United Kingdom") => ({ title, domain, url, sourceCountry });
  it("collapses identical headlines into one row with the other outlets counted", () => {
    const groups = groupSources([s("Big news", "a.co.uk"), s("big news ", "b.co.uk"), s("Different", "c.com", undefined, null)]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ title: "Big news", url: "https://a.co.uk/a", others: [{ domain: "b.co.uk", url: "https://b.co.uk/a" }] });
    expect(groups[1].label).toBe("c.com");
  });
});
