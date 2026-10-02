import { describe, expect, it } from "vitest";
import { isHistoryRange, parseYahooHistory, yahooSymbolForLabel } from "./marketHistory";
import { areaPath, changePercent, formatTick, linePath, nearestIndex, niceTicks, sampleEvenly } from "./chartMath";

describe("parseYahooHistory", () => {
  const body = (timestamp: number[], close: (number | null)[]) => ({ chart: { result: [{ timestamp, indicators: { quote: [{ close }] } }] } });

  it("pairs timestamps with closes, in milliseconds, oldest first", () => {
    expect(parseYahooHistory(body([200, 100], [11, 10]))).toEqual([{ t: 100_000, v: 10 }, { t: 200_000, v: 11 }]);
  });
  it("skips bars with no trades instead of plotting zero", () => {
    expect(parseYahooHistory(body([1, 2, 3], [5, null, 7])).map((p) => p.v)).toEqual([5, 7]);
  });
  it("returns nothing for an empty or malformed response", () => {
    expect(parseYahooHistory(null)).toEqual([]);
    expect(parseYahooHistory({ chart: { result: null } })).toEqual([]);
  });
});

describe("symbol and range validation", () => {
  it("only knows the symbols the ticker shows", () => {
    expect(yahooSymbolForLabel("BRENT")).toBe("BZ=F");
    expect(yahooSymbolForLabel("USD/INR")).toBe("INR=X");
    expect(yahooSymbolForLabel("AAPL")).toBeNull();
    expect(yahooSymbolForLabel("../etc/passwd")).toBeNull();
  });
  it("only accepts the offered ranges", () => {
    expect(isHistoryRange("1M")).toBe(true);
    expect(isHistoryRange("10Y")).toBe(false);
    expect(isHistoryRange("constructor")).toBe(false);
  });
});

describe("chart math", () => {
  it("picks clean ticks that cover the data", () => {
    const { ticks, step } = niceTicks(96.3, 104.1, 4);
    expect(step).toBe(2);
    expect(ticks).toEqual([98, 100, 102, 104]);
  });
  it("formats ticks to the precision of the step", () => {
    expect(formatTick(4200, 50)).toBe("4,200");
    expect(formatTick(95.5, 0.5)).toBe("95.5");
    expect(formatTick(6.55, 0.05)).toBe("6.55");
    expect(formatTick(97.5, 2.5)).toBe("97.5");
  });
  it("builds line and area paths", () => {
    expect(linePath([0, 10], [5, 7])).toBe("M0.0 5.0 L10.0 7.0");
    expect(areaPath([0, 10], [5, 7], 20)).toBe("M0.0 5.0 L10.0 7.0 L10.0 20.0 L0.0 20.0 Z");
  });
  it("finds the nearest point to the pointer", () => {
    expect(nearestIndex(14, [0, 10, 20, 30])).toBe(1);
    expect(nearestIndex(99, [0, 10, 20, 30])).toBe(3);
  });
  it("computes percentage change and guards a zero start", () => {
    expect(changePercent(100, 103)).toBeCloseTo(3);
    expect(changePercent(0, 5)).toBeNull();
  });
  it("samples evenly, keeping the ends", () => {
    expect(sampleEvenly([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4)).toEqual([1, 4, 7, 10]);
    expect(sampleEvenly([1, 2], 5)).toEqual([1, 2]);
  });
});
