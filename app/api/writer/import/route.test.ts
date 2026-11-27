import { describe, expect, it, vi } from "vitest";

const user = vi.hoisted(() => ({ current: null as null | { id: string; email: string } }));
vi.mock("@/lib/supabase-user", () => ({ getSessionUser: async () => user.current }));
vi.mock("@/lib/analystDesk", () => ({ getAnalyst: async (e: string) => (e === "writer@x.com" ? { email: e, name: "W", bio: "", active: true } : null) }));
import { POST } from "./route";

const send = async (name: string, content: BlobPart, type = "application/octet-stream") => {
  const fd = new FormData();
  fd.append("file", new File([content], name, { type }));
  const res = await POST(new Request("https://x.test/api/writer/import", { method: "POST", body: fd }));
  return { status: res.status, json: (await res.json()) as { ok: boolean; error?: string } };
};

describe("/api/writer/import", () => {
  it("needs a signed-in analyst or the owner", async () => {
    user.current = null;
    expect((await send("a.docx", "PK")).status).toBe(401);
    user.current = { id: "u", email: "reader@x.com" };
    expect((await send("a.docx", "PK")).status).toBe(403);
  });
  it("rejects wrong types, fake files and old .doc files with a clear message", async () => {
    user.current = { id: "u", email: "writer@x.com" };
    expect((await send("a.txt", "hello")).json.error).toContain("Word (.docx) or PDF");
    expect((await send("a.docx", "not a zip")).json.error).toContain("does not look like a Word");
    expect((await send("a.pdf", "not a pdf")).json.error).toContain("does not look like a PDF");
    expect((await send("a.doc", "x")).json.error).toContain("Save As");
  });
  it("rejects files over 4 MB", async () => {
    user.current = { id: "u", email: "writer@x.com" };
    const r = await send("big.pdf", new Uint8Array(4 * 1024 * 1024 + 1));
    expect(r.status).toBe(413);
  });
});
