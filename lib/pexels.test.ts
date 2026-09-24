import { describe, expect, it } from "vitest";
import {
  extractCountryFromHeadline,
  extractKeyActor,
  isDiplomaticContext,
  isGenericStock,
} from "./pexels";

describe("extractCountryFromHeadline", () => {
  it("finds a known country mentioned in the headline", () => {
    expect(extractCountryFromHeadline("Germany faces winter with lowest gas storage in 15 years")).toBe("Germany");
  });

  it("returns null when no known country is mentioned", () => {
    expect(extractCountryFromHeadline("Oil rebounds above $100 as traders eye diplomacy")).toBeNull();
  });
});

describe("extractKeyActor", () => {
  it("extracts a capitalized name from the headline", () => {
    // The headline's first word is skipped since it's always capitalized
    // regardless of content -- "Xi" is the first real candidate here.
    expect(extractKeyActor("Trump and Xi convene in Washington amid trade turbulence", null)).toBe("Xi");
  });

  it("excludes the detected country from the result, falling through to the next candidate", () => {
    const actor = extractKeyActor("Modi meets Biden in Washington after India trade deal", "India");
    expect(actor).toBe("Biden");
  });

  it("returns null when the headline has no distinctive capitalized phrase", () => {
    expect(extractKeyActor("oil prices climb amid trade war escalation", null)).toBeNull();
  });
});

describe("isDiplomaticContext", () => {
  it("treats the Political category as diplomatic", () => {
    expect(isDiplomaticContext("Political", "Some headline", "Some body")).toBe(true);
  });

  it("treats a UN/summit mention in the body as diplomatic even outside Political", () => {
    expect(isDiplomaticContext("Trade & Tariffs", "Tariffs deepen", "Talks continue at the United Nations summit")).toBe(true);
  });

  it("is not diplomatic for an unrelated category with no diplomatic language", () => {
    expect(isDiplomaticContext("Resources", "Oil falls for third day", "Saudi pipeline repair hopes ease supply fears")).toBe(false);
  });
});

describe("isGenericStock", () => {
  it("blocks generic filler like handshakes and globes", () => {
    expect(isGenericStock("Two businessmen shaking hands over a globe", false)).toBe(true);
  });

  it("allows a flag photo when the story is diplomatic", () => {
    expect(isGenericStock("National flags outside a government building", true)).toBe(false);
  });

  it("doesn't specially exempt a flag photo outside a diplomatic context, but doesn't hard-block it either", () => {
    // A flag isn't filler the way a handshake/globe/boardroom photo is --
    // it just no longer gets a free pass, so it lives or dies on its
    // normal relevance score like any other candidate.
    expect(isGenericStock("National flag on a pole", false)).toBe(false);
  });

  it("does not penalize a photo with no alt text at all", () => {
    expect(isGenericStock("", false)).toBe(false);
  });

  it("allows a specific, non-generic photo through", () => {
    expect(isGenericStock("Cargo ship loaded with containers at port", false)).toBe(false);
  });
});
