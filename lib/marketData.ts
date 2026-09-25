// Market ticker: Copper, USD/INR, Gold -- editorial context for a site that
// covers oil geopolitics and India-Russia energy trade heavily, not
// financial decoration.
//
// Brent (XBR/USD) and Silver (XAG/USD) are confirmed-real Twelve Data
// symbols but return "This symbol is available starting with the Grow or
// Venture plan" on the current (free Basic) API key -- a paid-plan
// restriction, not a code bug. They're commented out rather than deleted so
// they're one uncomment away from working if the plan is ever upgraded; see
// https://twelvedata.com/pricing.
//
// Copper's symbol was simply wrong: XCU/USD doesn't exist on Twelve Data at
// all ("symbol or figi parameter is missing or invalid"). Their actual
// symbol is HG1 (Copper Spot, price per pound), confirmed via
// twelvedata.com/markets/662294/commodity/hg1.
import { supabaseServer } from "./supabase-server";

export type MarketSymbolConfig = { symbol: string; label: string };

export const MARKET_SYMBOLS: MarketSymbolConfig[] = [
  // { symbol: "XBR/USD", label: "BRENT" },  -- needs Twelve Data Grow/Venture plan
  // { symbol: "XAG/USD", label: "SILVER" }, -- needs Twelve Data Grow/Venture plan
  { symbol: "HG1", label: "COPPER" },
  { symbol: "USD/INR", label: "USD/INR" },
  { symbol: "XAU/USD", label: "GOLD" },
];

export type MarketQuote = {
  price: number;
  changePercent: number | null;
};

export type QuoteResult =
  | { ok: true; quote: MarketQuote }
  | { ok: false; reason: string };

export type MarketDataRow = {
  symbol: string;
  label: string;
  price: number;
  change_percent: number | null;
  updated_at: string;
};

export async function getMarketRows(): Promise<MarketDataRow[]> {
  try {
    const supabase = supabaseServer();
    const { data } = await supabase.from("market_data").select("symbol, label, price, change_percent, updated_at");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function fetchQuote(symbol: string): Promise<QuoteResult> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return { ok: false, reason: "TWELVE_DATA_API_KEY not set" };

  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      // Twelve Data's error responses are JSON with a real `message` even
      // on a non-2xx status (e.g. 404/429) -- reading only the status code
      // and discarding the body was hiding the actual reason (plan
      // restriction vs. bad symbol vs. rate limit) behind a bare "HTTP 404".
      const body = await res.json().catch(() => null);
      return { ok: false, reason: body?.message ? `HTTP ${res.status}: ${body.message}` : `HTTP ${res.status}` };
    }

    const data = await res.json();
    // Twelve Data returns {code, message, status:"error"} on a bad symbol,
    // unsupported plan, or rate-limit, not an HTTP error status -- must
    // check the body, and the message is what actually explains why (e.g.
    // "not available" for a symbol the current plan doesn't include).
    if (data?.status === "error" || data?.code) {
      return { ok: false, reason: data?.message || `Twelve Data error code ${data?.code}` };
    }

    const price = parseFloat(data.close);
    if (!Number.isFinite(price)) return { ok: false, reason: `Unparseable close price: ${JSON.stringify(data.close)}` };

    const changePercent = data.percent_change != null ? parseFloat(data.percent_change) : null;

    return {
      ok: true,
      quote: { price, changePercent: Number.isFinite(changePercent as number) ? (changePercent as number) : null },
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Unknown fetch error" };
  }
}
