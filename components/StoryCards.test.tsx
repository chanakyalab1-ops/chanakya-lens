import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { CompactCard, MobileRow } from "./Feed";
import type { Story } from "@/lib/stories";

const brief = { slug: "b", headline: "A brief with no impact chain", dek: "d", body: "", category: "Political", readTime: "2 min", hasVideo: false, publishedAt: "2026-10-01T00:00:00Z" } as unknown as Story;

describe("story cards without an impact chain", () => {
  it("MobileRow renders", () => expect(renderToString(<MobileRow story={brief} />)).toContain("A brief with no impact chain"));
  it("CompactCard renders", () => expect(renderToString(<CompactCard story={brief} />)).toContain("A brief with no impact chain"));
});
