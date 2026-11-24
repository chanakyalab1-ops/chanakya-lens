import { describe, expect, it } from "vitest";
import { storyEmailHtml } from "./storyEmail";

describe("storyEmailHtml", () => {
  it("escapes story text and links to the story", () => {
    const h = storyEmailHtml({ slug: "a-b", headline: "<b>Hi</b>", dek: "d", category: "Political", body: "one\n\ntwo" });
    expect(h).toContain("&lt;b&gt;Hi&lt;/b&gt;");
    expect(h).toContain("https://chanakyalens.com/story/a-b");
    expect(h).not.toContain("<b>Hi");
  });
});
