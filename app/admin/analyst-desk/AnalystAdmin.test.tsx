import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("./actions", () => ({ addAnalyst: vi.fn(), publishPost: vi.fn(), requestChanges: vi.fn(), setAnalystActive: vi.fn(), unpublishPost: vi.fn() }));
import { AnalystAdmin } from "./AnalystAdmin";
import type { Post } from "@/lib/analystDesk";

const post = (o: Partial<Post>): Post => ({ id: "1", slug: "s", authorEmail: "a@b.com", authorName: "Asha", title: "A piece", summary: "", body: "word word", heroUrl: "", tags: [], status: "submitted", editorNote: "", submittedAt: null, publishedAt: null, createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", ...o });

describe("AnalystAdmin", () => {
  it("shows pieces waiting for review with publish and request-changes buttons", () => {
    const html = renderToString(<AnalystAdmin analysts={[{ email: "a@b.com", name: "Asha", bio: "", active: true }]} posts={[post({})]} />);
    expect(html).toContain("Waiting for you (1)");
    expect(html).toContain("Publish");
    expect(html).toContain("Request changes");
    expect(html).toContain("Asha");
  });
  it("offers Unpublish, not Publish, for a published piece", () => {
    const html = renderToString(<AnalystAdmin analysts={[]} posts={[post({ status: "published" })]} />);
    expect(html).toContain("Published (1)");
    expect(html).toContain("Unpublish");
    expect(html).not.toContain(">Publish<");
  });
});
