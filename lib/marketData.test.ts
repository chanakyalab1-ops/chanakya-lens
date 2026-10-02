import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchQuoteFor, parseYahooChart, MARKET_SYMBOLS } from "./marketData";
import { formatChange } from "../components/MarketTicker";

const yahooBody = (price: number, prev: number) => ({
  chart: { result: [{ meta: { regularMarketPrice: price, chartPreviousClose: prev } }], error: null },
});

describe("parseYahooChart", () => {
  it("reads the price and computes the day's change from the previous close", () => {
    const r = parseYahooChart(yahooBody(102.27, 105.28));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.quote.price).toBe(102.27);
      expect(r.quote.changePercent).toBeCloseTo(-2.859, 2);
    }
  });
  it("gives a null change when there is no previous close", () => {
    const r = parseYahooChart({ chart: { result: [{ meta: { regularMarketPrice: 5 } }] } });
    expect(r.ok && r.quote.changePercent).toBeNull();
  });
  it("fails on an empty or malformed response", () => {
    expect(parseYahooChart({ chart: { result: null, error: { code: "Not Found" } } }).ok).toBe(false);
    expect(parseYahooChart(null).ok).toBe(false);
    expect(parseYahooChart({ chart: { result: [{ meta: { regularMarketPrice: 0 } }] } }).ok).toBe(false);
  });
});

describe("fetchQuoteFor fallback", () => {
  afterEach(() => vi.unstubAllGlobals());
  const gold = MARKET_SYMBOLS.find((m) => m.label === "GOLD")!;
  const brent = MARKET_SYMBOLS.find((m) => m.label === "BRENT")!;

  it("uses Yahoo when Twelve Data reports a plan restriction", async () => {
    vi.stubEnv("TWELVE_DATA_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      url.includes("twelvedata")
        ? new Response(JSON.stringify({ status: "error", message: "available starting with the Grow plan" }), { status: 200 })
        : new Response(JSON.stringify(yahooBody(4204.4, 4168.4)), { status: 200 }),
    ));
    const r = await fetchQuoteFor(gold);
    expect(r.ok && r.quote.price).toBe(4204.4);
  });
  it("prefers Twelve Data when it works", async () => {
    vi.stubEnv("TWELVE_DATA_API_KEY", "k");
    const spy = vi.fn(async () => new Response(JSON.stringify({ close: "4173.0", percent_change: "-0.8" }), { status: 200 }));
    vi.stubGlobal("fetch", spy);
    const r = await fetchQuoteFor(gold);
    expect(r.ok && r.quote.price).toBe(4173);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it("goes straight to Yahoo for instruments Twelve Data does not carry (Brent)", async () => {
    const spy = vi.fn(async () => new Response(JSON.stringify(yahooBody(102.27, 105.28)), { status: 200 }));
    vi.stubGlobal("fetch", spy);
    const r = await fetchQuoteFor(brent);
    expect(r.ok).toBe(true);
    expect(String((spy.mock.calls[0] as unknown[])[0])).toContain("yahoo");
  });
  it("reports both reasons when every source fails", async () => {
    vi.stubEnv("TWELVE_DATA_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    const r = await fetchQuoteFor(gold);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toContain("twelve");
      expect(r.reason).toContain("Yahoo");
    }
  });
});

describe("formatChange", () => {
  it("signs and rounds", () => {
    expect(formatChange(1.234)).toBe("+1.23%");
    expect(formatChange(-2.859)).toBe("-2.86%");
  });
  it("shows a flat day as 0.00%, and nothing when unknown", () => {
    expect(formatChange(0.001)).toBe("0.00%");
    expect(formatChange(null)).toBe("");
  });
});
