import { describe, expect, it, vi } from "vitest";

const now = Date.now();
const iso = (hoursAgo: number) => new Date(now - hoursAgo * 3600 * 1000).toISOString();

vi.mock("@/lib/stories", () => ({
  getAllStories: async () => [
    { slug: "old", headline: "Old story", publishedAt: iso(60) },
    { slug: "fresh", headline: "Iran & Oman <talks>", publishedAt: iso(5) },
  ],
}));

import { GET } from "./route";

describe("news-sitemap.xml", () => {
  it("lists only stories from the last 48 hours, with escaped titles", async () => {
    const xml = await (await GET()).text();
    expect(xml).toContain("/story/fresh");
    expect(xml).not.toContain("/story/old");
    expect(xml).toContain("Iran &amp; Oman &lt;talks&gt;");
    expect(xml).toContain("<news:name>Chanakya Lens</news:name>");
  });
});
