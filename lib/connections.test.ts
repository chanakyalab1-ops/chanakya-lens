import { describe, expect, it } from "vitest";
import { connectionsFor } from "./connections";
import { SYSTEMS } from "./lens";
import type { Story } from "./stories";

const kw = SYSTEMS[0].keywords[0];
const mk = (slug: string, at: string, text = kw): Story =>
  ({ slug, category: "Resources", headline: `${text} ${slug}`, dek: "", body: "", readTime: "1", publishedAt: at, subjectCountries: [] }) as unknown as Story;

describe("connectionsFor", () => {
  it("lists other stories on the same Lens page, newest first, without the story itself", () => {
    const a = mk("a", "2026-11-20");
    const all = [a, mk("b", "2026-11-18"), mk("c", "2026-11-21"), mk("d", "2026-11-10", "unrelated words")];
    const c = connectionsFor(a, all);
    expect(c.length).toBeGreaterThan(0);
    expect(c[0].stories.map((s) => s.slug)).toEqual(["c", "b"]);
  });
  it("returns nothing when no other story shares a page", () => {
    const a = mk("a", "2026-11-20");
    expect(connectionsFor(a, [a])).toEqual([]);
  });
});
