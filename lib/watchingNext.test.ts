import { describe, expect, it } from "vitest";
import { parseWatchingNext } from "./watchingNext";

describe("parseWatchingNext", () => {
  it("splits lines, strips bullets, drops blanks", () => {
    expect(parseWatchingNext("- Vote on Friday\n\n* Oil price reaction\n3. Talks resume")).toEqual(["Vote on Friday", "Oil price reaction", "Talks resume"]);
  });
  it("caps items and length, ignores non-strings", () => {
    expect(parseWatchingNext("a\nb\nc\nd\ne\nf")).toHaveLength(5);
    expect(parseWatchingNext("x".repeat(500))[0]).toHaveLength(200);
    expect(parseWatchingNext(null)).toEqual([]);
  });
});
