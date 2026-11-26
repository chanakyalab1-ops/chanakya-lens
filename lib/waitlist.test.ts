import { describe, expect, it } from "vitest";
import { cleanEmail, cleanSource, waitlistEmailHtml } from "./waitlist";

describe("cleanEmail", () => {
  it("accepts and normalises a normal address", () => {
    expect(cleanEmail("  Reader@Example.COM ")).toBe("reader@example.com");
  });
  it("rejects bad input", () => {
    for (const bad of ["", "no-at", "a@b", "a b@c.com", "<x>@c.com", 5, null, "a@b.c", `${"x".repeat(250)}@c.com`]) expect(cleanEmail(bad)).toBeNull();
  });
});

describe("helpers", () => {
  it("keeps a source tag simple", () => {
    expect(cleanSource("insta-story<script>")).toBe("insta-storyscript");
    expect(cleanSource(7)).toBe("");
  });
  it("promises early access only", () => {
    expect(waitlistEmailHtml()).toContain("first");
    expect(waitlistEmailHtml()).not.toMatch(/\$|price|discount/i);
  });
});
