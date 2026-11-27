import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("./actions", () => ({ savePost: vi.fn(), deleteMyDraft: vi.fn() }));
import { PostEditor } from "./PostEditor";

const post = { id: "1", title: "Why Hormuz matters", summary: "s", body: "word ".repeat(40), heroUrl: "", tags: "Iran", status: "draft" as const, editorNote: "", slug: "x" };

describe("PostEditor", () => {
  it("lets a writer save and send to the editor", () => {
    const html = renderToString(<PostEditor initial={post} locked={false} isOwner={false} />);
    expect(html).toContain("Save draft");
    expect(html).toContain("Send to the editor");
    expect(html).toContain("110 more to send");
  });
  it("shows the editor's note when changes were requested", () => {
    const html = renderToString(<PostEditor initial={{ ...post, status: "changes", editorNote: "Tighten the second section" }} locked={false} isOwner={false} />);
    expect(html).toContain("From the editor");
    expect(html).toContain("Tighten the second section");
  });
  it("is read-only while the piece is with the editor", () => {
    const html = renderToString(<PostEditor initial={{ ...post, status: "submitted" }} locked isOwner={false} />);
    expect(html).toContain("read-only");
    expect(html).not.toContain("Send to the editor");
    expect(html).not.toContain("Save draft");
  });
  it("the owner can save but has no send-to-editor button", () => {
    const html = renderToString(<PostEditor initial={post} locked={false} isOwner />);
    expect(html).toContain("Save draft");
    expect(html).not.toContain("Send to the editor");
  });
});
