import { describe, expect, it } from "vitest";
import { guessCategory } from "./categoryGuess";

describe("guessCategory", () => {
  it("spots each category from the headline", () => {
    expect(guessCategory("Missile strike hits port as ceasefire talks stall")).toBe("Security & Conflict");
    expect(guessCategory("US raises tariffs on steel imports")).toBe("Trade & Tariffs");
    expect(guessCategory("EU opens antitrust probe into chipmaker")).toBe("Tech & Regulation");
    expect(guessCategory("Crude oil jumps as OPEC cuts output")).toBe("Resources");
    expect(guessCategory("Coalition collapses ahead of election")).toBe("Political");
    expect(guessCategory("FIFA bans federation over government interference")).toBe("Sports & Power");
  });
  it("falls back to Other", () => {
    expect(guessCategory("Local bakery wins award")).toBe("Other");
  });
});
