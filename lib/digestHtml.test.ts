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

import { announcementFromEnv } from "./digestHtml";
describe("digest announcement", () => {
  it("is absent unless set", () => {
    expect(announcementFromEnv({})).toBeUndefined();
    expect(buildDigestHtml([mk(1)], "All", "a@x.com")).not.toContain("New on Chanakya Lens");
  });
  it("renders escaped text and an https link", () => {
    const a = announcementFromEnv({ DIGEST_ANNOUNCEMENT: "Follow <topics>", DIGEST_ANNOUNCEMENT_URL: "https://chanakyalens.com/account/watchlist" });
    const html = buildDigestHtml([mk(1)], "All", "a@x.com", false, a);
    expect(html).toContain("New on Chanakya Lens");
    expect(html).toContain("Follow &lt;topics&gt;");
    expect(html).toContain('href="https://chanakyalens.com/account/watchlist"');
  });
  it("drops non-https links", () => {
    expect(announcementFromEnv({ DIGEST_ANNOUNCEMENT: "x", DIGEST_ANNOUNCEMENT_URL: "javascript:alert(1)" })?.url).toBeUndefined();
  });
});
