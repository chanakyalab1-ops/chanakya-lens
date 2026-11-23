import { describe, expect, it } from "vitest";
import { decidePopup, latestDate, popupAllowedOn } from "./popup";
import type { WhatsNewEntry } from "./whatsNew";

const e = (date: string, title: string): WhatsNewEntry => ({ date, title, body: "a body text" });
const entries = [e("2026-11-23", "c"), e("2026-11-10", "b"), e("2026-10-01", "a")];

describe("decidePopup", () => {
  it("welcomes a first-time visitor", () => {
    expect(decidePopup({ seenIntro: false, lastSeenDate: null, entries })).toEqual({ kind: "welcome" });
  });
  it("shows only entries newer than the last one seen", () => {
    const d = decidePopup({ seenIntro: true, lastSeenDate: "2026-11-10", entries });
    expect(d).toEqual({ kind: "whatsNew", entries: [entries[0]] });
  });
  it("shows nothing when the reader is up to date", () => {
    expect(decidePopup({ seenIntro: true, lastSeenDate: "2026-11-23", entries })).toBeNull();
  });
  it("caps how many are listed", () => {
    const many = ["2026-12-05", "2026-12-04", "2026-12-03", "2026-12-02"].map((d) => e(d, d));
    const d = decidePopup({ seenIntro: true, lastSeenDate: "2026-01-01", entries: many });
    expect(d && d.kind === "whatsNew" ? d.entries : []).toHaveLength(3);
  });
});

describe("popupAllowedOn", () => {
  it("is hidden on admin, account, membership and the pages it links to", () => {
    for (const p of ["/review", "/review/manage", "/admin", "/account/login", "/membership", "/start-here", "/whats-new"]) expect(popupAllowedOn(p)).toBe(false);
  });
  it("is allowed on public pages", () => {
    for (const p of ["/", "/story/some-story", "/today", "/lens/strait-of-hormuz"]) expect(popupAllowedOn(p)).toBe(true);
  });
});

describe("latestDate", () => {
  it("finds the newest", () => {
    expect(latestDate(entries)).toBe("2026-11-23");
    expect(latestDate([])).toBeNull();
  });
});
