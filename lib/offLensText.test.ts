import { describe, it, expect } from "vitest";
import { describeSources, hasEnoughCoverage, buildOffLensPrompt, parseOffLens } from "./offLensText";

const src = (url: string, title: string, domain = "", source_country: string | null = null) => ({ url, title, domain, source_country });

describe("describeSources", () => {
  it("fills in countries from the article URL and drops unknown outlets", () => {
    const out = describeSources([
      src("https://www.thelocal.it/x", "A", "feeds.thelocal.com"),
      src("https://example.com/y", "B", "example.com"),
      src("https://aljazeera.com/z", "C", "aljazeera.com", "Qatar"),
    ]);
    expect(out.map((s) => s.country)).toEqual(["Italy", "Qatar"]);
    expect(out[0].outlet).toBe("thelocal.it");
  });
});

describe("hasEnoughCoverage", () => {
  it("needs two countries", () => {
    expect(hasEnoughCoverage([{ outlet: "a", country: "India", title: "" }, { outlet: "b", country: "India", title: "" }])).toBe(false);
    expect(hasEnoughCoverage([{ outlet: "a", country: "India", title: "" }, { outlet: "b", country: "Qatar", title: "" }])).toBe(true);
  });
});

describe("buildOffLensPrompt", () => {
  it("lists every outlet with its country and headline", () => {
    const p = buildOffLensPrompt(
      { headline: "H", dek: "D", subjectCountries: ["Iran"], sources: [] },
      [{ outlet: "dawn.com", country: "Pakistan", title: "T" }],
    );
    expect(p).toContain('1. dawn.com (Pakistan): "T"');
    expect(p).toContain("Countries the story is about: Iran");
  });
});

describe("parseOffLens", () => {
  it("reads a note out of the reply", () => {
    expect(parseOffLens('Here: {"offLens": "Gulf outlets led while Iranian outlets were absent."}')).toBe(
      "Gulf outlets led while Iranian outlets were absent.",
    );
  });
  it("returns null for null, junk and very short notes", () => {
    expect(parseOffLens('{"offLens": null}')).toBeNull();
    expect(parseOffLens("no json")).toBeNull();
    expect(parseOffLens('{"offLens": "ok"}')).toBeNull();
  });
});
