import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/stories", () => ({
  getAllStories: async () => [
    { slug: "a", headline: "Iran & Oman <talks>", dek: "Dek \"quoted\"", category: "Energy", publishedAt: "2026-10-04T10:00:00Z" },
    { slug: "b", headline: "Newer", dek: "", category: "Trade", publishedAt: "2026-10-05T10:00:00Z" },
  ],
}));

import { GET } from "./route";

describe("rss.xml", () => {
  it("serves valid-looking RSS, newest first, with escaped text", async () => {
    const res = await GET();
    expect(res.headers.get("Content-Type")).toContain("application/rss+xml");
    const xml = await res.text();
    expect(xml.indexOf("/story/b")).toBeLessThan(xml.indexOf("/story/a"));
    expect(xml).toContain("Iran &amp; Oman &lt;talks&gt;");
    expect(xml).toContain("Dek &quot;quoted&quot;");
    expect(xml).toContain("<pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate>");
  });
});
