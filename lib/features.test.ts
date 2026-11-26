import { describe, expect, it } from "vitest";
import { FEATURES } from "./features";

describe("features list", () => {
  it("has unique names and the three tiers", () => {
    const names = FEATURES.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
    for (const t of ["everyone", "account", "plus"]) expect(FEATURES.some((f) => f.tier === t)).toBe(true);
  });
  it("describes every feature fully", () => {
    for (const f of FEATURES) {
      expect(f.text.length).toBeGreaterThan(20);
      expect(f.how.length).toBeGreaterThan(5);
    }
  });
});
