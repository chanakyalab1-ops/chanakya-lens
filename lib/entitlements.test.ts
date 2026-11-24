import { describe, expect, it } from "vitest";
import { paidAccessFor, PAID_FEATURES } from "./entitlements";

const owner = "chanakya.lab1@gmail.com";
describe("paidAccessFor", () => {
  it("hides paid tools from everyone but the owner until membership is public", () => {
    expect(paidAccessFor({ email: "a@b.co", isMember: true, membershipPublic: false })).toBe("hidden");
    expect(paidAccessFor({ email: owner, isMember: false, membershipPublic: false })).toBe("allowed");
  });
  it("locks free readers and allows members once public", () => {
    expect(paidAccessFor({ email: "a@b.co", isMember: false, membershipPublic: true })).toBe("locked");
    expect(paidAccessFor({ email: "a@b.co", isMember: true, membershipPublic: true })).toBe("allowed");
  });
  it("always lets the owner test", () => {
    expect(paidAccessFor({ email: owner, isMember: false, membershipPublic: true })).toBe("allowed");
  });
  it("covers the six paid tools", () => {
    expect(Object.keys(PAID_FEATURES).sort()).toEqual(["ask", "compare", "emailMe", "export", "reading", "watch"]);
  });
});
