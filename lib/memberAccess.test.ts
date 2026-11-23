import { describe, expect, it } from "vitest";
import { membershipVisibleTo } from "./memberAccess";

describe("membershipVisibleTo", () => {
  it("shows membership only to the owner by default", () => {
    expect(membershipVisibleTo("chanakya.lab1@gmail.com", false)).toBe(true);
    expect(membershipVisibleTo("Chanakya.Lab1@gmail.com", false)).toBe(true);
    expect(membershipVisibleTo("someone@else.com", false)).toBe(false);
    expect(membershipVisibleTo(null, false)).toBe(false);
    expect(membershipVisibleTo(undefined, false)).toBe(false);
  });
  it("shows it to everyone once public", () => {
    expect(membershipVisibleTo("someone@else.com", true)).toBe(true);
    expect(membershipVisibleTo(null, true)).toBe(true);
  });
});
