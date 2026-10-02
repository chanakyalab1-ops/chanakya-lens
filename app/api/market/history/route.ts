import { NextRequest, NextResponse } from "next/server";
import { fetchHistory, HISTORY_RANGES, isHistoryRange, yahooSymbolForLabel } from "@/lib/marketHistory";

// GET /api/market/history?symbol=BRENT&range=1M
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const range = req.nextUrl.searchParams.get("range") ?? "1M";

  if (!yahooSymbolForLabel(symbol)) return NextResponse.json({ error: "Unknown symbol" }, { status: 400 });
  if (!isHistoryRange(range)) return NextResponse.json({ error: "Unknown range" }, { status: 400 });

  try {
    const points = await fetchHistory(symbol, range);
    const { ttl } = HISTORY_RANGES[range];
    return NextResponse.json(
      { symbol, range, points },
      { headers: { "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 4}` } },
    );
  } catch {
    // Short cache so a Yahoo hiccup isn't pinned at the CDN for an hour.
    return NextResponse.json({ error: "History unavailable" }, { status: 502, headers: { "Cache-Control": "public, s-maxage=30" } });
  }
}
