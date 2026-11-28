import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("./actions", () => ({ addAnalyst: vi.fn(), publishPost: vi.fn(), requestChanges: vi.fn(), setAnalystActive: vi.fn(), setAnalystShowEmail: vi.fn(), unpublishPost: vi.fn() }));
import { AnalystAdmin } from "./AnalystAdmin";
import type { Post } from "@/lib/analystDesk";

const post = (o: Partial<Post>): Post => ({ id: "1", slug: "s", authorEmail: "a@b.com", authorName: "Asha", storySlug: "a-story", title: "A piece", summary: "", body: "word word", heroUrl: "", tags: [], status: "submitted", editorNote: "", submittedAt: null, publishedAt: null, createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", ...o });

describe("AnalystAdmin", () => {
  it("lists live pieces with Request changes and Unpublish, and no Publish button", () => {
    const html = renderToString(<AnalystAdmin analysts={[{ email: "a@b.com", name: "Asha", bio: "", active: true, showEmail: false }]} posts={[post({ status: "published" })]} />);
    expect(html).toContain("Live (1)");
    expect(html).toContain("Request changes");
    expect(html).toContain("Unpublish");
    expect(html).not.toContain(">Publish<");
    expect(html).not.toContain("Waiting for you");
    expect(html).toContain("Asha");
  });
  it("still shows a legacy piece waiting with the editor", () => {
    const html = renderToString(<AnalystAdmin analysts={[]} posts={[post({})]} />);
    expect(html).toContain("Waiting for you (1)");
    expect(html).toContain(">Publish<");
  });
  it("shows a tick-box and a toggle for showing a writer's email", () => {
    const html = renderToString(<AnalystAdmin analysts={[{ email: "a@b.com", name: "Asha", bio: "", active: true, showEmail: true }]} posts={[]} />);
    expect(html).toContain("Show her email under her pieces");
    expect(html).toContain("email shown on her pieces");
    expect(html).toContain("Hide email");
  });
});
