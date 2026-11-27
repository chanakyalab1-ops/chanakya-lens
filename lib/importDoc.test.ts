import { describe, expect, it } from "vitest";
import { htmlToMarkdown, pdfTextToEditor, splitTitleAndBody, tidyCitations, wordDocToEditor } from "./importDoc";
import { parseBlocks } from "./miniMarkdown";

describe("Word import", () => {
  const html =
    '<h1>Tiny Chips, Massive Stakes</h1><p><strong>Geopolitical analysis | Opinion</strong> Chaithra B</p><p>The affair began with <em>personal</em> ties.[<a href="https://bbc.com/a">bbc</a>][<a href="https://apnews.com/b">apnews</a>]</p><p><strong>A supply chain with no single owner</strong></p><p>Chips are layered &amp; spread out.</p><ul><li><p><strong>Taiwan</strong> is the keystone.</p></li><li>Japan matters.</li></ul>';
  it("finds the heading, drops the byline, makes section headings, lists and tidy links", () => {
    const r = wordDocToEditor(html);
    expect(r.title).toBe("Tiny Chips, Massive Stakes");
    expect(r.body).not.toContain("Chaithra B");
    expect(r.body).toContain("The affair began with *personal* ties.");
    expect(r.body).toContain("[bbc](https://bbc.com/a), [apnews](https://apnews.com/b)");
    expect(r.body).toContain("## A supply chain with no single owner");
    expect(r.body).toContain("Chips are layered & spread out.");
    expect(r.body).toContain("- **Taiwan** is the keystone.\n- Japan matters.");
  });
  it("what it produces renders with the site's own parser", () => {
    const blocks = parseBlocks(wordDocToEditor(html).body);
    expect(blocks.map((b) => b.t)).toEqual(["p", "h2", "p", "ul"]);
  });
  it("ignores unsafe links and scripts", () => {
    const md = htmlToMarkdown('<p>Hi <a href="javascript:alert(1)">click</a><script>x</script></p>');
    expect(md).not.toContain("javascript:");
  });
  it("uses a short first line as the heading when there is no title style", () => {
    const r = splitTitleAndBody("My heading\n\nThis is the first paragraph of the piece. It has a full stop.");
    expect(r.title).toBe("My heading");
    expect(r.body).toBe("This is the first paragraph of the piece. It has a full stop.");
  });
  it("tidies citations", () => {
    expect(tidyCitations("Claim.[[bbc](https://b.com/x)][[ap](https://a.com/y)]")).toBe("Claim. [bbc](https://b.com/x), [ap](https://a.com/y)");
  });
});

describe("PDF import", () => {
  const text = [
    "Tiny Chips, Massive Stakes",
    "",
    "The NVIDIA affair began as a story about personal relationships, elite access and",
    "institutional accountability. China denies the espionage claims and calls them an",
    "unsubstantiated smear campaign.",
    "",
    "A supply chain with no single owner",
    "A semiconductor is the product of a layered international chain. It involves design,",
    "fabrication, specialised equipment, raw materials and dis-",
    "tribution across several countries.",
    "",
    "12",
  ].join("\n");
  it("rebuilds the heading, section headings and paragraphs", () => {
    const r = pdfTextToEditor(text);
    expect(r.title).toBe("Tiny Chips, Massive Stakes");
    expect(r.body).toContain("## A supply chain with no single owner");
    expect(r.body).toContain("The NVIDIA affair began as a story about personal relationships, elite access and institutional accountability.");
    expect(r.body).toContain("distribution across several countries.");
    expect(r.body).not.toMatch(/\n12$/);
  });
  it("joins a heading that wrapped onto two lines", () => {
    const r = pdfTextToEditor("Tiny Chips, Massive Stakes: The US-China Rivalry for\nTechnological Supremacy\nThe affair began with a long first paragraph that goes on for a while and ends here.\n\nMore text follows in a second paragraph that also ends properly.");
    expect(r.title).toBe("Tiny Chips, Massive Stakes: The US-China Rivalry for Technological Supremacy");
    expect(r.body.startsWith("The affair began")).toBe(true);
  });
  it("copes with empty text", () => {
    expect(pdfTextToEditor("")).toEqual({ title: "", body: "" });
  });
});
