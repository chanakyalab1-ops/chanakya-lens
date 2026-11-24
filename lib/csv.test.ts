import { describe, expect, it } from "vitest";
import { csvField, toCsv } from "./csv";

describe("csv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvField('a, "b"')).toBe('"a, ""b"""');
    expect(csvField("plain")).toBe("plain");
  });
  it("neutralises spreadsheet formulas", () => {
    expect(csvField("=SUM(A1)")).toBe("'=SUM(A1)");
  });
  it("joins rows", () => {
    expect(toCsv([["a", "b"], ["c", "d"]])).toBe("a,b\r\nc,d\r\n");
  });
});
