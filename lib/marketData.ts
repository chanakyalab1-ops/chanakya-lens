// Market ticker: Brent, Gold, USD/INR, Copper, Silver -- editorial context
// for a site that covers oil geopolitics and India-Russia energy trade
// heavily, not financial decoration.
//
// Twelve Data's free plan doesn't include Brent (XBR/USD) or Silver
// (XAG/USD) -- "available starting with the Grow or Venture plan" -- so those
// come from Yahoo Finance's chart endpoint, which also backs up the other
// three if Twelve Data is down or rate-limited. Brent and the metals are
// front-month futures there, which is what "Brent $102" means in practice.
// Copper's Twelve Data symbol is HG1 (Copper Spot, price per pound).
import { supabaseServer } from "./supabase-server";

export type MarketSymbolConfig = {
  // Key stored in market_data.symbol -- unchanged for existing rows.
  symbol: string;
  label: string;
  // Twelve Data symbol, tried first when present.
  twelve?: string;
  // Yahoo Finance chart symbol: the fallback when Twelve Data fails or the
  // plan doesn't include the instrument, and the only source for Brent and
  // Silver. Unofficial and keyless, so it is never the sole dependency for
  // gold or USD/INR.
  yahoo?: string;
};

export const MARKET_SYMBOLS: MarketSymbolConfig[] = [
  { symbol: "BZ=F", label: "BRENT", yahoo: "BZ=F" },
  { symbol: "XAU/USD", label: "GOLD", twelve: "XAU/USD", yahoo: "GC=F" },
  { symbol: "USD/INR", label: "USD/INR", twelve: "USD/INR", yahoo: "INR=X" },
  { symbol: "HG1", label: "COPPER", twelve: "HG1", yahoo: "HG=F" },
  { symbol: "SI=F", label: "SILVER", yahoo: "SI=F" },
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

// Yahoo's chart endpoint: regularMarketPrice vs chartPreviousClose gives the
// day's change. Pure so it can be tested without the network.
export function parseYahooChart(json: unknown): QuoteResult {
  const result = (json as { chart?: { result?: { meta?: Record<string, unknown> }[] | null } })?.chart?.result?.[0];
  const meta = result?.meta;
  const price = Number(meta?.regularMarketPrice);
  if (!meta || !Number.isFinite(price) || price <= 0) return { ok: false, reason: "Yahoo: no price in response" };
  const prev = Number(meta.chartPreviousClose ?? meta.previousClose);
  const changePercent = Number.isFinite(prev) && prev > 0 ? ((price - prev) / prev) * 100 : null;
  return { ok: true, quote: { price, changePercent } };
}

export async function fetchYahooQuote(symbol: string): Promise<QuoteResult> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
      { cache: "no-store", headers: { "user-agent": "Mozilla/5.0 (compatible; ChanakyaLensBot/1.0)" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { ok: false, reason: `Yahoo HTTP ${res.status}` };
    return parseYahooChart(await res.json());
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? `Yahoo: ${err.message}` : "Yahoo: unknown fetch error" };
  }
}

// Twelve Data first, Yahoo second. Both failing leaves the cached row alone
// (the ticker drops it once it is stale rather than showing an old price).
export async function fetchQuoteFor(cfg: MarketSymbolConfig): Promise<QuoteResult> {
  const reasons: string[] = [];
  if (cfg.twelve) {
    const r = await fetchQuote(cfg.twelve);
    if (r.ok) return r;
    reasons.push(`twelve: ${r.reason}`);
  }
  if (cfg.yahoo) {
    const r = await fetchYahooQuote(cfg.yahoo);
    if (r.ok) return r;
    reasons.push(r.reason);
  }
  return { ok: false, reason: reasons.join(" | ") || "no data source configured" };
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
