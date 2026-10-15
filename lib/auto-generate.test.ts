import { describe, expect, it } from "vitest";
import { buildGroups, flagRepeats, toProposal, type CandidateRow } from "./auto-generate";
import type { KnownStory } from "./duplicates";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();
let n = 0;
function row(over: Partial<CandidateRow> & { title: string; domain: string }): CandidateRow {
  n++;
  return { id: `id-${n}`, url: `https://${over.domain}/${n}`, source_country: null, seen_date: hoursAgo(1), ...over };
}

// "bbc.com" and friends are trusted domains, so each of these clears the score floor.
const hormuz = (domain: string, country: string) =>
  row({ title: `Iran seizes oil tanker near Strait of Hormuz, Gulf shipping halted`, domain, source_country: country });
const grid = (domain: string, country: string) =>
  row({ title: `Germany announces emergency gas storage release for winter`, domain, source_country: country });

describe("buildGroups", () => {
  it("ranks the most widely covered story first, one article per outlet", () => {
    const rows = [
      grid("dw.com", "Germany"), grid("bbc.com", "United Kingdom"),
      hormuz("bbc.com", "United Kingdom"), hormuz("aljazeera.com", "Qatar"), hormuz("dw.com", "Germany"),
      hormuz("thehindu.com", "India"),
    ];
    const { groups } = buildGroups(rows, 5);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveLength(4); // hormuz: 4 outlets
    expect(groups[1]).toHaveLength(2); // grid: 2 outlets
  });

  it("respects the limit", () => {
    const rows = [hormuz("bbc.com", "UK"), hormuz("dw.com", "DE"), grid("bbc.com", "UK"), grid("dw.com", "DE")];
    expect(buildGroups(rows, 1).groups).toHaveLength(1);
  });

  it("leaves out rows with no title and repeats of recent stories", () => {
    const rows = [row({ title: "", domain: "bbc.com" }), hormuz("bbc.com", "UK"), hormuz("dw.com", "DE")];
    expect(buildGroups(rows, 5).groups).toHaveLength(1);
    expect(buildGroups(rows, 5, () => true).groups).toHaveLength(0);
  });

  it("turns the leftovers of a one-outlet cluster into at most one story", () => {
    const rows = [grid("bbc.com", "UK"), grid("bbc.com", "UK"), grid("bbc.com", "UK")];
    expect(buildGroups(rows, 5).groups).toHaveLength(1);
  });
});

describe("toProposal", () => {
  it("summarises a group: lead headline, outlets, countries, newest article", () => {
    const a = hormuz("bbc.com", "United Kingdom");
    const b = { ...hormuz("aljazeera.com", "Qatar"), seen_date: hoursAgo(5) };
    const c = hormuz("dw.com", "Germany");
    const p = toProposal([a.id, b.id, c.id], new Map([a, b, c].map((r) => [r.id, r])))!;
    expect(p.headline).toBe(a.title);
    expect(p).toMatchObject({ outlets: 3, countries: 3, candidateIds: [a.id, b.id, c.id] });
    expect(p.sources.map((s) => s.domain)).toEqual(["bbc.com", "aljazeera.com", "dw.com"]);
    expect(new Date(p.newestAt!).getTime()).toBeGreaterThan(Date.now() - 2 * 3600e3);
  });
  it("returns null when none of the articles exist any more", () => {
    expect(toProposal(["gone"], new Map())).toBeNull();
  });
});


describe("flagRepeats", () => {
  const row = (id: string, title: string, url: string): CandidateRow => ({ id, url, title, source_country: null, domain: `${id}.com`, seen_date: null });
  const rows = new Map([
    row("1", "Yemen government launches offensive to recapture Houthi territory", "https://a.com/1"),
    row("2", "Brazil senate passes budget after long debate", "https://b.com/2"),
    row("3", "Yemeni government forces open offensive against Houthis to retake territory", "https://c.com/3"),
  ].map((r) => [r.id, r] as const));

  const known: KnownStory[] = [
    { slug: "old-yemen", headline: "Yemen offensive", state: "in_review", titles: ["Yemen government launches offensive to recapture Houthi territory"], urls: [] },
  ];

  it("flags a group that repeats a story already in the pipeline, and leaves new ones alone", () => {
    const out = flagRepeats([["1"], ["2"]], rows, known);
    expect(out[0]).toMatchObject({ slug: "old-yemen", state: "in_review" });
    expect(out[1]).toBeNull();
  });

  it("flags a later group that repeats an earlier one in the same list", () => {
    const out = flagRepeats([["1"], ["3"]], rows, []);
    expect(out[0]).toBeNull();
    expect(out[1]).toMatchObject({ state: "proposed" });
  });
});
