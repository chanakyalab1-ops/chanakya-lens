import { describe, expect, it } from "vitest";
import { readingMap } from "./readStats";

describe("readingMap", () => {
  const read = [
    { category: "Political", subjectCountries: ["Iran"] },
    { category: "Political", subjectCountries: ["Iran", "Peru"] },
    { category: "Resources" },
  ];
  const recent = [{ category: "Political", subjectCountries: ["Iran"] }, { category: "Resources", subjectCountries: ["Chile", "Chile"] }, { category: "Political", subjectCountries: ["Chile"] }];
  it("counts what was read", () => {
    const m = readingMap(read, recent);
    expect(m.total).toBe(3);
    expect(m.categories[0]).toEqual({ name: "Political", count: 2 });
    expect(m.countries[0]).toEqual({ name: "Iran", count: 2 });
  });
  it("lists countries in the news that were never read", () => {
    expect(readingMap(read, recent).unseen).toEqual([{ name: "Chile", count: 3 }]);
  });
});
