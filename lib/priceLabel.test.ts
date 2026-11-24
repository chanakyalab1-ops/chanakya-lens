import { describe, expect, it } from "vitest";
import { splitPriceLabel, yearlySavings } from "./priceLabel";

describe("splitPriceLabel", () => {
  it("splits amount and period", () => {
    expect(splitPriceLabel("$2.99 / month")).toEqual({ amount: "$2.99", period: "month" });
    expect(splitPriceLabel(" $29.99/year ")).toEqual({ amount: "$29.99", period: "year" });
  });
  it("keeps an unparsable label whole", () => {
    expect(splitPriceLabel("Free")).toEqual({ amount: "Free", period: "" });
    expect(splitPriceLabel(undefined)).toEqual({ amount: "", period: "" });
  });
});

describe("yearlySavings", () => {
  it("works out the saving against twelve months", () => {
    expect(yearlySavings("$2.99", "$29.99")).toBe("Save 16%");
  });
  it("says nothing when it is not a saving or currencies differ", () => {
    expect(yearlySavings("$2.99", "$35.88")).toBeNull();
    expect(yearlySavings("$2.99", "₹299")).toBeNull();
    expect(yearlySavings("x", "y")).toBeNull();
  });
});
