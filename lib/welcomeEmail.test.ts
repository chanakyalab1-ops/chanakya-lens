import { describe, expect, it } from "vitest";
import { welcomeEmailHtml } from "./welcomeEmail";
import { PERKS } from "./plans";

describe("welcomeEmailHtml", () => {
  it("lists every perk and the first steps", () => {
    const h = welcomeEmailHtml();
    for (const p of PERKS) expect(h).toContain(p.title);
    expect(h).toContain("/account/watchlist");
    expect(h).toContain("/tools");
    expect(h).toContain("/refund");
  });
  it("tells a gift member when it ends and drops the cancel and refund talk", () => {
    const h = welcomeEmailHtml({ gift: true, endsAt: "2027-11-25T00:00:00Z" });
    expect(h).toContain("25 November 2027");
    expect(h).not.toContain("/refund");
  });
});
