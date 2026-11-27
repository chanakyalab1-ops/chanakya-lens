import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("./actions", () => ({ savePost: vi.fn(), deleteMyDraft: vi.fn() }));
import { PostEditor } from "./PostEditor";

const stories = [{ slug: "a-story", headline: "A story headline" }];
const post = { id: "1", storySlug: "a-story", title: "Why Hormuz matters", body: "word ".repeat(40), status: "draft" as const, editorNote: "", slug: "x" };

describe("PostEditor", () => {
  it("lets a writer save a draft and publish it herself", () => {
    const html = renderToString(<PostEditor stories={stories} initial={post} locked={false} isOwner={false} />);
    expect(html).toContain("Save draft");
    expect(html).toContain(">Publish<");
    expect(html).not.toContain("Send to the editor");
    expect(html).toContain("10 more to publish");
    expect(html).toContain("On our story:");
    expect(html).toContain("A story headline");
    expect(html).toContain("Heading");
    expect(html).not.toContain("Tags");
    expect(html).not.toContain("Header image");
    expect(html).not.toContain("summary");
  });
  it("asks which story only when none is chosen yet", () => {
    const html = renderToString(<PostEditor stories={stories} initial={null} locked={false} isOwner={false} />);
    expect(html).toContain("The story this write-up is about");
    expect(html).toContain("Choose a story");
  });
  it("shows the editor's note when changes were requested", () => {
    const html = renderToString(<PostEditor stories={stories} initial={{ ...post, status: "changes", editorNote: "Tighten the second section" }} locked={false} isOwner={false} />);
    expect(html).toContain("From the editor");
    expect(html).toContain("Tighten the second section");
    expect(html).toContain(">Publish<");
  });
  it("saves changes to a live piece in place, with no second Publish button", () => {
    const html = renderToString(<PostEditor stories={stories} initial={{ ...post, status: "published" }} locked={false} isOwner={false} />);
    expect(html).toContain("Save changes");
    expect(html).not.toContain(">Publish<");
    expect(html).toContain("live straight away");
  });
  it("is read-only when locked", () => {
    const html = renderToString(<PostEditor stories={stories} initial={{ ...post, status: "submitted" }} locked isOwner={false} />);
    expect(html).toContain("read-only");
    expect(html).not.toContain("Save draft");
  });
});
