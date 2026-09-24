// Market ticker: Brent, USD/INR, Gold -- editorial context for a site that
// covers oil geopolitics and India-Russia energy trade heavily, not
// financial decoration. Confirmed against Twelve Data's own listings
// (twelvedata.com/markets/874865/commodity/xbr-usd for Brent,
// twelvedata.com's XAU/USD gold spot page) since a wrong symbol here is
// worse than not shipping the feature at all.
import { supabaseServer } from "./supabase-server";

export type MarketSymbolConfig = { symbol: string; label: string };

export const MARKET_SYMBOLS: MarketSymbolConfig[] = [
  { symbol: "XBR/USD", label: "BRENT" },
  { symbol: "USD/INR", label: "USD/INR" },
  { symbol: "XAU/USD", label: "GOLD" },
];

export type MarketQuote = {
  price: number;
  changePercent: number | null;
};

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

export async function fetchQuote(symbol: string): Promise<MarketQuote | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;

    const data = await res.json();
    // Twelve Data returns {code, message, status:"error"} on a bad symbol
    // or rate-limit, not an HTTP error status -- must check the body.
    if (data?.status === "error" || data?.code) return null;

    const price = parseFloat(data.close);
    if (!Number.isFinite(price)) return null;

    const changePercent = data.percent_change != null ? parseFloat(data.percent_change) : null;

    return { price, changePercent: Number.isFinite(changePercent as number) ? (changePercent as number) : null };
  } catch {
    return null;
  }
}
