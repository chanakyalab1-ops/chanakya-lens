import { describe, expect, it } from "vitest";
import { buildEmail, buildFollowup, firstName, followupDueAt, gmailComposeUrl, needsFollowup, validEmail } from "./outreachEmail";

const base = { name: "Priya Sharma", videoTitle: "Why oil moves", topic: "oil prices", specific: "explain the shipping angle.", version: "geo" as const, sender: "Sam" };

describe("buildEmail", () => {
  it("personalises and keeps the opt-out and disclosure lines", () => {
    const e = buildEmail(base);
    expect(e.body).toContain("Hi Priya,");
    expect(e.body).toContain('I watched your "Why oil moves" on oil prices and liked how you explain the shipping angle.');
    expect(e.body).toContain('reply "no thanks"');
    expect(e.body).toContain("disclose the partnership");
    expect(e.body).toContain("payouts start when paid membership opens");
    expect(e.body.endsWith("chanakyalens.com")).toBe(true);
    expect(e.subject).toBe("A tool for your audience on oil prices");
  });
  it("uses the economy wording and never mentions UPSC", () => {
    const e = buildEmail({ ...base, version: "econ" });
    expect(e.body).toContain("fuel, food, exports, jobs");
    expect(`${e.subject}${e.body}`.toLowerCase()).not.toContain("upsc");
  });
  it("falls back gracefully when fields are empty", () => {
    const e = buildEmail({ ...base, videoTitle: "", specific: "", topic: "", sender: "" });
    expect(e.body).toContain("I really like the geopolitics content you post.");
    expect(e.body).not.toContain("I watched");
    expect(e.subject).toBe("Who is covering the story, and who is not");
    expect(e.body).toContain("[Your name]");
  });
});

describe("followups and links", () => {
  it("builds a follow-up in the same thread", () => {
    const f = buildFollowup(base, "A tool for your audience on oil prices");
    expect(f.subject).toBe("Re: A tool for your audience on oil prices");
    expect(f.body).toContain("I will not write again");
  });
  it("encodes the Gmail compose link", () => {
    const u = gmailComposeUrl("a@b.com", "Hi & bye", "line1\nline2");
    expect(u).toContain("https://mail.google.com/mail/?view=cm");
    expect(u).toContain("to=a%40b.com");
    expect(decodeURIComponent(u.replace(/\+/g, " "))).toContain("Hi & bye");
  });
  it("flags a follow-up only after 5 days, once, and not after a reply", () => {
    const sent = "2026-11-01T00:00:00Z";
    const day = (n: number) => Date.parse(sent) + n * 86400000;
    expect(needsFollowup({ status: "sent", sent_at: sent, followup_sent_at: null }, day(4))).toBe(false);
    expect(needsFollowup({ status: "sent", sent_at: sent, followup_sent_at: null }, day(5))).toBe(true);
    expect(needsFollowup({ status: "sent", sent_at: sent, followup_sent_at: "2026-11-06T00:00:00Z" }, day(9))).toBe(false);
    expect(needsFollowup({ status: "replied", sent_at: sent, followup_sent_at: null }, day(9))).toBe(false);
    expect(needsFollowup({ status: "no", sent_at: sent, followup_sent_at: null }, day(9))).toBe(false);
    expect(followupDueAt(null)).toBeNull();
  });
  it("helpers", () => {
    expect(firstName("  Priya Sharma ")).toBe("Priya");
    expect(firstName("")).toBe("there");
    expect(validEmail("a@b.co")).toBe(true);
    expect(validEmail("nope")).toBe(false);
  });
});

import { parseBulk } from "./outreachEmail";
describe("parseBulk", () => {
  it("parses names, emails, handles and versions; reports bad lines; drops duplicates", () => {
    const r = parseBulk("Tanya Vats | tanyaavats11@gmail.com | @tanyaavats_\nRasika Jamdade, rasika@x.com, https://instagram.com/rasikajamdade, econ\nno email here\nTanya Again | TANYAAVATS11@gmail.com\n# comment\nNameless | https://x.com | a@b.co");
    expect(r.rows.map((x) => x.email)).toEqual(["tanyaavats11@gmail.com", "rasika@x.com", "a@b.co"]);
    expect(r.rows[0].channelUrl).toBe("https://instagram.com/tanyaavats_");
    expect(r.rows[1].version).toBe("econ");
    expect(r.rows[2].name).toBe("Nameless");
    expect(r.errors).toHaveLength(1);
  });
});
