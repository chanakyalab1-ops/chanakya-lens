import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline, previewBlocks } from "./miniMarkdown";

describe("parseInline", () => {
  it("handles bold, italic and https links", () => {
    expect(parseInline("a **b** *c* [d](https://x.co)")).toEqual([
      { t: "text", v: "a " }, { t: "b", v: "b" }, { t: "text", v: " " }, { t: "i", v: "c" }, { t: "text", v: " " }, { t: "a", v: "d", href: "https://x.co" },
    ]);
  });
  it("never turns a non-https link into a link", () => {
    const r = parseInline("[x](javascript:alert(1))");
    expect(r.some((i) => i.t === "a")).toBe(false);
  });
  it("leaves html as plain text", () => {
    expect(parseInline("<img onerror=x>")).toEqual([{ t: "text", v: "<img onerror=x>" }]);
  });
});

describe("charts", () => {
  it("recognises a chart line and ignores unknown ones", () => {
    expect(parseBlocks("[[chart:countries]]")).toEqual([{ t: "chart", kind: "countries" }]);
    expect(parseBlocks("[[chart:nope]]").map((b) => b.t)).toEqual(["p"]);
  });
});

describe("parseBlocks", () => {
  const md = "## Title\n\nIntro with **bold**.\n\n- one\n- two\n\n![map](https://img.co/a.png)\n\n> quoted line\n\n### Sub";
  it("splits into headings, paragraphs, lists, images and quotes", () => {
    expect(parseBlocks(md).map((b) => b.t)).toEqual(["h2", "p", "ul", "img", "quote", "h3"]);
  });
  it("rejects non-https images", () => {
    expect(parseBlocks("![x](http://img.co/a.png)").map((b) => b.t)).toEqual(["p"]);
  });
  it("keeps only the opening blocks for a preview", () => {
    expect(previewBlocks(parseBlocks(md), 2)).toHaveLength(2);
  });
});
