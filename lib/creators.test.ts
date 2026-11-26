import { describe, expect, it } from "vitest";
import { validateApplication } from "./creators";
import { insertDigestSignup, readRefCookie, sanitizeRef } from "./referral";

describe("validateApplication", () => {
  const ok = { name: " Asha ", email: "Asha@Example.com", channelUrl: "youtube.com/@asha", audience: "50k", note: "hi" };
  it("cleans a good application", () => {
    expect(validateApplication(ok)).toEqual({ name: "Asha", email: "asha@example.com", channelUrl: "https://youtube.com/@asha", audience: "50k", note: "hi" });
  });
  it("rejects missing or bad fields", () => {
    expect(validateApplication({ ...ok, email: "nope" })).toBeNull();
    expect(validateApplication({ ...ok, name: "" })).toBeNull();
    expect(validateApplication({ ...ok, channelUrl: "javascript:alert(1)" })).toBeNull();
    expect(validateApplication(null)).toBeNull();
  });
});

describe("referral helpers", () => {
  it("accepts simple names only", () => {
    expect(sanitizeRef(" Asha_K ")).toBe("asha_k");
    expect(sanitizeRef("a b")).toBeNull();
    expect(sanitizeRef("<script>")).toBeNull();
  });
  it("reads the cookie", () => {
    expect(readRefCookie("a=1; cl_ref=asha; b=2")).toBe("asha");
    expect(readRefCookie("a=1")).toBeNull();
  });
  it("falls back to a plain insert when the ref column is missing", async () => {
    const calls: Record<string, unknown>[] = [];
    const client = {
      from: () => ({
        insert: async (row: Record<string, unknown>) => {
          calls.push(row);
          return "ref" in row ? { error: { code: "42703", message: 'column "ref" does not exist' } } : { error: null };
        },
      }),
    };
    const res = await insertDigestSignup(client, { email: "a@b.co", regions: [] }, "asha");
    expect(res.error).toBeNull();
    expect(calls).toHaveLength(2);
    expect("ref" in calls[1]).toBe(false);
  });
});
