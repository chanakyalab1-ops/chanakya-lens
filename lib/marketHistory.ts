import { MARKET_SYMBOLS } from "./marketData";

// Price history for the ticker's trend chart, fetched on demand from Yahoo
// Finance's chart endpoint (the same source that backs the ticker) rather than
// stored: history is there from day one, there is nothing to maintain, and
// the route caches responses at the CDN. If Yahoo ever becomes unreliable the
// fallback is to snapshot prices in the database from the existing cron.
export type HistoryRange = "5D" | "1M" | "3M" | "1Y";

export const HISTORY_RANGES: Record<HistoryRange, { range: string; interval: string; ttl: number }> = {
  "5D": { range: "5d", interval: "30m", ttl: 900 },
  "1M": { range: "1mo", interval: "1d", ttl: 3600 },
  "3M": { range: "3mo", interval: "1d", ttl: 3600 },
  "1Y": { range: "1y", interval: "1d", ttl: 3600 },
};

export type HistoryPoint = { t: number; v: number };

export function isHistoryRange(value: string): value is HistoryRange {
  return Object.prototype.hasOwnProperty.call(HISTORY_RANGES, value);
}

// Only symbols the ticker already shows can be asked for -- the route is not a
// general-purpose proxy to Yahoo.
export function yahooSymbolForLabel(label: string): string | null {
  const cfg = MARKET_SYMBOLS.find((m) => m.label === label);
  return cfg?.yahoo ?? null;
}

export function parseYahooHistory(json: unknown): HistoryPoint[] {
  const result = (json as { chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] | null } })
    ?.chart?.result?.[0];
  const stamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const points: HistoryPoint[] = [];
  for (let i = 0; i < stamps.length; i++) {
    const v = closes[i];
    // Yahoo returns null for bars with no trades; skip them rather than draw a drop to zero.
    if (typeof v === "number" && Number.isFinite(v) && v > 0) points.push({ t: stamps[i] * 1000, v });
  }
  return points.sort((a, b) => a.t - b.t);
}

export async function fetchHistory(label: string, range: HistoryRange): Promise<HistoryPoint[]> {
  const symbol = yahooSymbolForLabel(label);
  if (!symbol) throw new Error("Unknown symbol");
  const { range: r, interval, ttl } = HISTORY_RANGES[range];
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${r}&interval=${interval}`,
    {
      headers: { "user-agent": "Mozilla/5.0 (compatible; ChanakyaLensBot/1.0)" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: ttl },
    },
  );
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  const points = parseYahooHistory(await res.json());
  if (points.length < 2) throw new Error("No history available");
  return points;
}
