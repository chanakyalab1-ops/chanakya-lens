import { describe, expect, it } from "vitest";
import { buildTimeline, resolveThreadRoot } from "./threadRules";

describe("resolveThreadRoot", () => {
  it("files a follow-up under the story it was set against", () => {
    expect(resolveThreadRoot({ slug: "first", thread_slug: null }, "second")).toBe("first");
  });
  it("uses the root when the chosen story is itself a follow-up", () => {
    expect(resolveThreadRoot({ slug: "second", thread_slug: "first" }, "third")).toBe("first");
  });
  it("never points a story at itself", () => {
    expect(resolveThreadRoot({ slug: "a", thread_slug: null }, "a")).toBeNull();
    expect(resolveThreadRoot({ slug: "b", thread_slug: "a" }, "a")).toBeNull();
  });
});

describe("buildTimeline", () => {
  it("orders oldest first", () => {
    const out = buildTimeline([
      { slug: "c", headline: "c", publishedAt: "2026-11-03T00:00:00Z" },
      { slug: "a", headline: "a", publishedAt: "2026-11-01T00:00:00Z" },
      { slug: "b", headline: "b", publishedAt: "2026-11-02T00:00:00Z" },
    ]);
    expect(out.map((i) => i.slug)).toEqual(["a", "b", "c"]);
  });
});
