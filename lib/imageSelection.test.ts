import { describe, expect, it } from "vitest";
import { sourcesAboutStory } from "./imageSelection";

describe("sourcesAboutStory", () => {
  const headline = "Houthis Strike Aden Airport After Evacuation Warning";
  const body = "The Houthi movement struck Aden airport in Yemen after warning civilians to evacuate.";
  it("keeps sources about the same event and drops stray ones", () => {
    const keep = { url: "a", domain: "a.com", title: "Houthis hit Aden airport after evacuation warning" };
    const stray = { url: "b", domain: "b.com", title: "Festival crowds celebrate in Jerusalem" };
    expect(sourcesAboutStory(headline, body, [stray, keep])).toEqual([keep]);
  });
  it("keeps sources with no title", () => {
    const s = { url: "c", domain: "c.com" };
    expect(sourcesAboutStory(headline, body, [s])).toEqual([s]);
  });
});
