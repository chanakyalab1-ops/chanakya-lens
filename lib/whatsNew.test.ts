import { describe, expect, it } from "vitest";
import { WHATS_NEW, sortedWhatsNew } from "./whatsNew";

describe("what's new", () => {
  it("has valid dates, text and internal or https links", () => {
    for (const e of WHATS_NEW) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.title.length).toBeGreaterThan(3);
      expect(e.body.length).toBeGreaterThan(10);
      if (e.href) expect(e.href.startsWith("/") || e.href.startsWith("https://")).toBe(true);
    }
  });
  it("lists newest first", () => {
    const out = sortedWhatsNew([
      { date: "2026-01-01", title: "old one", body: "something old here" },
      { date: "2026-03-01", title: "new one", body: "something new here" },
    ]);
    expect(out.map((e) => e.title)).toEqual(["new one", "old one"]);
  });
});
