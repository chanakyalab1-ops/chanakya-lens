import { describe, expect, it } from "vitest";
import { compareStories } from "./compare";
import type { Story } from "./stories";

const s = (slug: string) => ({ slug }) as Story;
describe("compareStories", () => {
  it("separates shared and unique stories", () => {
    const r = compareStories([s("1"), s("2")], [s("2"), s("3")]);
    expect(r.both.map((x) => x.slug)).toEqual(["2"]);
    expect(r.onlyA.map((x) => x.slug)).toEqual(["1"]);
    expect(r.onlyB.map((x) => x.slug)).toEqual(["3"]);
  });
});
