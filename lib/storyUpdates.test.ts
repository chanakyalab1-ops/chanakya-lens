import { describe, expect, it } from "vitest";
import { cleanUpdateNote, UPDATE_NOTE_MAX } from "./storyUpdates";

describe("cleanUpdateNote", () => {
  it("tidies whitespace and limits length", () => {
    expect(cleanUpdateNote("  Talks \n resumed  ")).toBe("Talks resumed");
    expect(cleanUpdateNote("x".repeat(1000))).toHaveLength(UPDATE_NOTE_MAX);
    expect(cleanUpdateNote(3)).toBe("");
  });
});
