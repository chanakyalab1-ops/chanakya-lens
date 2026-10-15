import { describe, expect, it } from "vitest";
import { selectDigestForSubscriber, type DigestStory } from "./digestStories";

const story = (slug: string, category: string, extra: Partial<DigestStory> = {}): DigestStory => ({
  slug, headline: slug, dek: "d", category, status: null, impact_nodes: null, ...extra,
});

const today = [story("a", "Energy"), story("b", "Defense", { status: "developing" }), story("c", "Markets")];

describe("selectDigestForSubscriber", () => {
  it("gives a subscriber with no topic preference everything", () => {
    const out = selectDigestForSubscriber(today, [])!;
    expect(out.fellBack).toBe(false);
    expect(out.topicLabel).toBe("All Topics");
    expect(out.stories).toHaveLength(3);
  });

  it("gives a subscriber the stories in their topics", () => {
    const out = selectDigestForSubscriber(today, ["Energy", "Markets"])!;
    expect(out.fellBack).toBe(false);
    expect(out.stories.map((s) => s.slug).sort()).toEqual(["a", "c"]);
    expect(out.topicLabel).toBe("Energy, Markets");
  });

  it("falls back to the top stories when none match, instead of sending nothing", () => {
    const out = selectDigestForSubscriber(today, ["Sports"])!;
    expect(out.fellBack).toBe(true);
    expect(out.topicLabel).toBe("Top Stories");
    expect(out.stories).toHaveLength(3);
  });

  it("puts developing stories first in the fallback", () => {
    expect(selectDigestForSubscriber(today, ["Sports"])!.stories[0].slug).toBe("b");
  });

  it("limits the number of stories", () => {
    const many = Array.from({ length: 10 }, (_, i) => story(`s${i}`, "Energy"));
    expect(selectDigestForSubscriber(many, [])!.stories).toHaveLength(6);
  });

  it("returns null when there are no stories at all", () => {
    expect(selectDigestForSubscriber([], ["Energy"])).toBeNull();
  });
});
