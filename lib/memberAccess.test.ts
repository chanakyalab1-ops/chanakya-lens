import { describe, expect, it } from "vitest";
import { membershipVisibleTo, testEmails } from "./memberAccess";

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

describe("test accounts", () => {
  it("reads a comma-separated list, ignoring case and spaces", () => {
    expect(testEmails(" A@x.com, b@y.com ,,")).toEqual(["a@x.com", "b@y.com"]);
    expect(testEmails(undefined)).toEqual([]);
  });
  it("lets listed accounts see membership while it is private", () => {
    expect(membershipVisibleTo("a@x.com", false, ["a@x.com"])).toBe(true);
    expect(membershipVisibleTo("A@X.com", false, ["a@x.com"])).toBe(true);
    expect(membershipVisibleTo("z@x.com", false, ["a@x.com"])).toBe(false);
  });
});
