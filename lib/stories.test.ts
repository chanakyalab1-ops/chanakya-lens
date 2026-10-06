import { describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ supabase: {} }));
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn }));

import { toListStory, type Story } from "./stories";

describe("toListStory", () => {
  it("keeps only outlet, country and role for each source", () => {
    const story = {
      slug: "a",
      headline: "H",
      sources: [{ url: "https://x.com/a", title: "Long title", domain: "x.com", sourceCountry: "India", role: "primary" }],
    } as unknown as Story;
    expect(toListStory(story).sources).toEqual([{ url: "", title: "", domain: "x.com", sourceCountry: "India", role: "primary" }]);
  });
  it("leaves stories without sources alone", () => {
    expect(toListStory({ slug: "b" } as unknown as Story).sources).toBeUndefined();
  });
});
