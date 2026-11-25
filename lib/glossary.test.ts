import { describe, expect, it } from "vitest";
import { GLOSSARY, glossaryFor } from "./glossary";
import { EXPLAINER_DRAFTS } from "./explainerDrafts";
import { ALL_ENTITIES, THEMES } from "./lens";

describe("glossary", () => {
  it("has unique slugs and is in alphabetical order", () => {
    const slugs = GLOSSARY.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const names = GLOSSARY.map((t) => t.term.toLowerCase());
    expect([...names].sort()).toEqual(names);
  });
  it("only points at Lens pages that exist", () => {
    const known = new Set(ALL_ENTITIES.map((e) => e.slug));
    for (const t of GLOSSARY) for (const l of t.lens ?? []) expect(known.has(l), `${t.term} -> ${l}`).toBe(true);
  });
  it("finds the terms for a Lens page", () => {
    expect(glossaryFor("strait-of-hormuz").map((t) => t.slug)).toContain("chokepoint");
  });
});

describe("explainer drafts", () => {
  it("refer to real storylines and stay hidden until published", () => {
    const themeSlugs = new Set(THEMES.map((t) => t.slug));
    for (const d of EXPLAINER_DRAFTS) {
      expect(themeSlugs.has(d.slug)).toBe(true);
      if (!d.published) expect(THEMES.find((t) => t.slug === d.slug)?.primer).toBeUndefined();
    }
  });
});
