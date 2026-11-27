import { describe, expect, it } from "vitest";
import { canWriterEdit, cleanTags, deriveSummary, readMinutes, slugifyPost, publishProblems, wordCount, writerStats } from "./analystDesk";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

describe("analyst desk helpers", () => {
  it("counts words and read time", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("a  b\nc")).toBe(3);
    expect(readMinutes(words(10))).toBe(1);
    expect(readMinutes(words(2200))).toBe(10);
  });
  it("cleans tags: trims, dedupes, caps at 6", () => {
    expect(cleanTags(" Iran, iran ,India,,China,Oil,Gas,Trade,Extra ")).toEqual(["Iran", "India", "China", "Oil", "Gas", "Trade"]);
  });
  it("makes safe slugs", () => {
    expect(slugifyPost("Why Hormuz Matters!")).toBe("why-hormuz-matters");
    expect(slugifyPost("???")).toBe("write-up");
  });
  it("lets a writer edit her pieces, including live ones, but not a legacy one with the editor", () => {
    expect(canWriterEdit("draft")).toBe(true);
    expect(canWriterEdit("changes")).toBe(true);
    expect(canWriterEdit("published")).toBe(true);
    expect(canWriterEdit("submitted")).toBe(false);
  });
  it("needs only a heading, a story and some text to publish", () => {
    expect(publishProblems({ title: "", body: "short", storySlug: "" })).toHaveLength(3);
    expect(publishProblems({ title: "T", body: words(50), storySlug: "a-story" })).toEqual([]);
    expect(publishProblems({ title: "T", body: words(50), storySlug: "" })).toEqual(["Choose the story this write-up is about."]);
  });
  it("derives the summary from the first plain paragraph", () => {
    expect(deriveSummary("## Heading\n\nThe **first** paragraph with a [link](https://x.com).\n\nSecond.")).toBe("The first paragraph with a link.");
    expect(deriveSummary("")).toBe("");
    const long = deriveSummary(words(200));
    expect(long.length).toBeLessThanOrEqual(222);
    expect(long.endsWith("…")).toBe(true);
  });
  it("summarises a writer's pieces", () => {
    const s = writerStats([{ status: "draft", body: words(10) }, { status: "submitted", body: words(20) }, { status: "changes", body: "" }, { status: "published", body: words(5) }, { status: "published", body: words(5) }]);
    expect(s).toEqual({ drafts: 1, withEditor: 1, changes: 1, published: 2, words: 40 });
  });
});
