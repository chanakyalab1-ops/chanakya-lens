import { describe, expect, it } from "vitest";
import { canAddToShelf, cleanNote, NOTE_MAX, SHELF_FREE_LIMIT } from "./shelf";

describe("canAddToShelf", () => {
  it("is unlimited until membership is public", () => {
    expect(canAddToShelf(500, { isMember: false, membershipPublic: false })).toBe(true);
  });
  it("caps free readers once membership is public", () => {
    expect(canAddToShelf(SHELF_FREE_LIMIT - 1, { isMember: false, membershipPublic: true })).toBe(true);
    expect(canAddToShelf(SHELF_FREE_LIMIT, { isMember: false, membershipPublic: true })).toBe(false);
  });
  it("never caps members", () => {
    expect(canAddToShelf(500, { isMember: true, membershipPublic: true })).toBe(true);
  });
});

describe("cleanNote", () => {
  it("collapses whitespace and trims", () => {
    expect(cleanNote("  why \n I   saved it ")).toBe("why I saved it");
  });
  it("limits length and ignores non-strings", () => {
    expect(cleanNote("x".repeat(1000))).toHaveLength(NOTE_MAX);
    expect(cleanNote(5)).toBe("");
  });
});
