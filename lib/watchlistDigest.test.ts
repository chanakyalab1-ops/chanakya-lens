import { describe, expect, it } from "vitest";
import { selectWatchlistDigest } from "./watchlistDigest";

const row = (slug: string, category: string, at: string, countries: string[] = []) =>
  ({ slug, headline: slug, dek: "", category, status: null, impact_nodes: null, subject_countries: countries, created_at: at });

describe("selectWatchlistDigest", () => {
  const stories = [row("a", "Resources", "2026-11-23T10:00:00Z"), row("b", "Political", "2026-11-23T12:00:00Z"), row("c", "Resources", "2026-11-23T09:00:00Z")];
  it("returns matching stories newest first", () => {
    expect(selectWatchlistDigest(stories, [{ kind: "category", slug: "Resources" }])!.map((s) => s.slug)).toEqual(["a", "c"]);
  });
  it("returns null with an empty watchlist or no match", () => {
    expect(selectWatchlistDigest(stories, [])).toBeNull();
    expect(selectWatchlistDigest(stories, [{ kind: "category", slug: "Tech & Regulation" }])).toBeNull();
  });
});
