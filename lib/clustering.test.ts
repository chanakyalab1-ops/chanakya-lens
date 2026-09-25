import { describe, expect, it } from "vitest";
import { suggestClusters, type Candidate } from "./clustering";

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
