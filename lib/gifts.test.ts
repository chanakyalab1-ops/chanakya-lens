import { describe, expect, it } from "vitest";
import { generateGiftCode, giftEmailHtml, giftPeriodEnd, normalizeGiftCode } from "./gifts";

describe("gift codes", () => {
  it("generates a 4-4-4 code from the safe alphabet", () => {
    const c = generateGiftCode();
    expect(c).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
    expect(generateGiftCode()).not.toBe(c);
  });
  it("round-trips through normalisation, forgiving case and spacing", () => {
    const c = generateGiftCode();
    expect(normalizeGiftCode(c.toLowerCase().replace(/-/g, " "))).toBe(c);
  });
  it("rejects things that cannot be codes", () => {
    for (const bad of ["", "ABC", "AAAA-BBBB-CCC0", "AAAA-BBBB-CCCI", 5, null]) expect(normalizeGiftCode(bad)).toBeNull();
  });
  it("puts the code in the email", () => {
    expect(giftEmailHtml("ABCD-EFGH-JKMN")).toContain("ABCD-EFGH-JKMN");
  });
});

describe("giftPeriodEnd", () => {
  const now = new Date("2026-11-25T00:00:00Z");
  it("gives a year from now", () => {
    expect(giftPeriodEnd(now, null).toISOString()).toBe("2027-11-25T00:00:00.000Z");
  });
  it("adds on top of time still left on an earlier gift", () => {
    expect(giftPeriodEnd(now, "2027-03-01T00:00:00Z").toISOString()).toBe("2028-03-01T00:00:00.000Z");
  });
  it("ignores an end date already in the past", () => {
    expect(giftPeriodEnd(now, "2026-01-01T00:00:00Z").toISOString()).toBe("2027-11-25T00:00:00.000Z");
  });
});
