import { describe, expect, it } from "vitest";
import { suggestClusters, attachRelated, coverageOf, pickSources, type Candidate } from "./clustering";

function candidate(overrides: Partial<Candidate> & Pick<Candidate, "id" | "title">): Candidate {
  return {
    domain: "example.com",
    source_country: null,
    seen_date: "2026-01-01T00:00:00.000Z",
    url: `https://example.com/${overrides.id}`,
    ...overrides,
  };
}

describe("suggestClusters", () => {
  it("groups candidates with similar titles seen close together", () => {
    const candidates = [
      candidate({ id: "a", title: "India refiners weigh retreat from Russian oil amid tariffs" }),
      candidate({ id: "b", title: "India refiners retreat from Russian oil as tariffs bite" }),
      candidate({ id: "c", title: "Germany faces winter with lowest gas storage in 15 years" }),
    ];

    const suggestions = suggestClusters(candidates);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].candidateIds.sort()).toEqual(["a", "b"]);
  });

  it("does not cluster similar titles that are more than 96 hours apart", () => {
    const candidates = [
      candidate({ id: "a", title: "India refiners weigh retreat from Russian oil amid tariffs", seen_date: "2026-01-01T00:00:00.000Z" }),
      candidate({ id: "b", title: "India refiners retreat from Russian oil as tariffs bite", seen_date: "2026-01-06T00:00:00.000Z" }),
    ];

    expect(suggestClusters(candidates)).toHaveLength(0);
  });

  it("excludes singleton groups (no similar match found)", () => {
    const candidates = [
      candidate({ id: "a", title: "Completely unrelated headline about shipping lanes" }),
    ];

    expect(suggestClusters(candidates)).toHaveLength(0);
  });

  it("sorts multiple suggestions by group size, largest first", () => {
    const candidates = [
      candidate({ id: "a", title: "Canada races to finalize India trade deal amid tariff war" }),
      candidate({ id: "b", title: "Canada finalizes India trade deal as tariff war deepens" }),
      candidate({ id: "c", title: "Canada nears India trade deal despite tariff war escalation" }),
      candidate({ id: "d", title: "Oil rebounds above $100 as traders eye US Iran diplomacy" }),
      candidate({ id: "e", title: "Oil climbs past $100 on US Iran diplomacy hopes" }),
    ];

    const suggestions = suggestClusters(candidates);

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].candidateIds).toHaveLength(3);
    expect(suggestions[1].candidateIds).toHaveLength(2);
  });

  it("does not throw on a candidate with a null/empty title (bad ingest row)", () => {
    const candidates = [
      candidate({ id: "a", title: "India refiners weigh retreat from Russian oil amid tariffs" }),
      candidate({ id: "b", title: null }),
      candidate({ id: "c", title: "" }),
    ];

    expect(() => suggestClusters(candidates)).not.toThrow();
  });
});


describe("attachRelated", () => {
  const pool = [
    candidate({ id: "a", domain: "jpost.com", title: "Pakistan rejects commission report on Afghan war role" }),
    candidate({ id: "b", domain: "dawn.com", title: "Pakistan rejects Afghan war commission report findings" }),
    candidate({ id: "c", domain: "aljazeera.com", title: "Commission report on Pakistan role in Afghan war draws reaction" }),
    candidate({ id: "d", domain: "dw.com", title: "Germany faces winter with lowest gas storage in 15 years" }),
    candidate({ id: "e", domain: "dawn.com", title: "Pakistan Afghan war commission report second take" }),
  ];

  it("tops up a single-article group with related articles from other domains", () => {
    const [group] = attachRelated([["a"]], pool);
    expect(group[0]).toBe("a");
    expect(group).toContain("b");
    expect(group).toContain("c");
    expect(group).not.toContain("d");
  });

  it("adds at most one article per domain", () => {
    const [group] = attachRelated([["a"]], pool);
    expect(group.filter((id) => id === "b" || id === "e")).toHaveLength(1);
  });

  it("never gives the same article to two groups", () => {
    const groups = attachRelated([["a"], ["d"]], pool);
    expect(new Set(groups.flat()).size).toBe(groups.flat().length);
  });

  it("respects the per-group cap", () => {
    const [group] = attachRelated([["a"]], pool, { maxPerGroup: 2 });
    expect(group).toHaveLength(2);
  });
});


describe("coverageOf / pickSources", () => {
  const many = [
    candidate({ id: "1", domain: "a.com", source_country: "India", title: "x" }),
    candidate({ id: "2", domain: "a.com", source_country: "India", title: "x2" }),
    candidate({ id: "3", domain: "b.com", source_country: "India", title: "x3" }),
    candidate({ id: "4", domain: "c.com", source_country: "Pakistan", title: "x4" }),
    candidate({ id: "5", domain: "d.com", source_country: "Israel", title: "x5" }),
  ];

  it("counts distinct outlets and countries, not articles", () => {
    expect(coverageOf(many)).toEqual({ outlets: 4, countries: 3 });
  });

  it("keeps one article per outlet", () => {
    expect(pickSources(many).map((m) => m.id)).not.toContain("2");
  });

  it("keeps country spread when trimming", () => {
    const ids = pickSources(many, 3).map((m) => m.id);
    expect(ids).toEqual(["1", "4", "5"]);
  });
});
