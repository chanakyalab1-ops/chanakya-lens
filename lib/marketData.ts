// Market ticker: Brent, Silver, Copper, USD/INR, Gold -- editorial context
// for a site that covers oil geopolitics and India-Russia energy trade
// heavily, not financial decoration. Confirmed against Twelve Data's own
// listings (twelvedata.com/markets/874865/commodity/xbr-usd for Brent,
// twelvedata.com's XAU/USD gold spot page) since a wrong symbol here is
// worse than not shipping the feature at all. These are spot/CFD-style
// commodity prices, not exchange futures contracts -- true continuous
// futures (e.g. ICE Brent front-month) aren't available on Twelve Data's
// individual API plans, only its separate business/futures product.
import { supabaseServer } from "./supabase-server";

export type MarketSymbolConfig = { symbol: string; label: string };

export const MARKET_SYMBOLS: MarketSymbolConfig[] = [
  { symbol: "XBR/USD", label: "BRENT" },
  { symbol: "XAG/USD", label: "SILVER" },
  { symbol: "XCU/USD", label: "COPPER" },
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
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };

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
