import { describe, expect, it, vi } from "vitest";

const user = vi.hoisted(() => ({ current: null as null | { id: string; email: string } }));
vi.mock("@/lib/supabase-user", () => ({ getSessionUser: async () => user.current }));
vi.mock("@/lib/analystDesk", () => ({
  STATUS_LABEL: { draft: "Draft", submitted: "With the editor", changes: "Changes requested", published: "Published" },
  getAnalyst: async (email: string) => (email === "writer@x.com" ? { email, name: "W", bio: "", active: true } : email === "paused@x.com" ? { email, name: "P", bio: "", active: false } : null),
  listPosts: async () => [
    { id: "1", title: "On this", status: "draft", storySlug: "story-a" },
    { id: "2", title: "On another", status: "published", storySlug: "story-b" },
  ],
}));
import { GET } from "./route";

const call = async (story = "story-a") => (await GET(new Request(`https://x.test/api/analyst?story=${story}`))).json();

describe("/api/analyst", () => {
  it("is false for signed-out readers and ordinary accounts", async () => {
    user.current = null;
    expect(await call()).toEqual({ analyst: false });
    user.current = { id: "u", email: "reader@x.com" };
    expect(await call()).toEqual({ analyst: false });
  });
  it("is false for a paused writer", async () => {
    user.current = { id: "u", email: "paused@x.com" };
    expect(await call()).toEqual({ analyst: false });
  });
  it("lists a writer's pieces about this story only", async () => {
    user.current = { id: "u", email: "writer@x.com" };
    expect(await call("story-a")).toEqual({ analyst: true, pieces: [{ id: "1", title: "On this", status: "draft", label: "Draft" }] });
    expect((await call("nothing")).pieces).toEqual([]);
  });
  it("lets the owner see it too", async () => {
    user.current = { id: "o", email: "chanakya.lab1@gmail.com" };
    expect((await call()).analyst).toBe(true);
  });
});
