import { describe, it, expect } from "vitest";
import { buildDigestHtml } from "./digestHtml";
import type { DigestStory } from "./digestStories";

const mk = (n: number, extra: Partial<DigestStory> = {}): DigestStory => ({
  slug: `s${n}`, headline: `Headline ${n}`, dek: `Dek ${n}`, category: "Geopolitics", status: null, impact_nodes: null, ...extra,
});

describe("buildDigestHtml", () => {
  it("renders top stories with links and unsubscribe", () => {
    const html = buildDigestHtml([mk(1, { image_url: "https://x/i.jpg" }), mk(2)], "All Topics", "a+b@x.com");
    expect(html).toContain("/story/s1");
    expect(html).toContain("https://x/i.jpg");
    expect(html).toContain("email=a%2Bb%40x.com");
  });
  it("escapes story text", () => {
    expect(buildDigestHtml([mk(1, { headline: "<b>&" })], "All", "a@x.com")).toContain("&lt;b&gt;&amp;");
  });
  it("shows Off-Lens only with multi-country coverage", () => {
    const plain = buildDigestHtml([mk(1)], "All", "a@x.com");
    expect(plain).not.toContain("Covered by");
    const rich = buildDigestHtml([mk(1, { off_lens_countries: { US: 3, IN: 2 } })], "All", "a@x.com");
    expect(rich).toContain("Covered by 2 countries");
  });
});
