import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { MARKET_SYMBOLS, fetchQuote } from "@/lib/marketData";
import { sendAlert } from "@/lib/alerts";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseServer();
  let updated = 0;
  const failures: string[] = [];

  for (const { symbol, label } of MARKET_SYMBOLS) {
    const result = await fetchQuote(symbol);
    if (!result.ok) {
      // Leave the cached row untouched -- a stale ticker is caught by
      // comparing updated_at client-side, never by overwriting good data
      // with a bad/missing fetch.
      failures.push(`${symbol}: ${result.reason}`);
      continue;
    }

    const { error } = await supabase.from("market_data").upsert({
      symbol,
      label,
      price: result.quote.price,
      change_percent: result.quote.changePercent,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      failures.push(`${symbol} (db: ${error.message})`);
    } else {
      updated++;
    }
  }

  if (failures.length > 0) {
    await sendAlert("update-market-data", `Failed to update: ${failures.join(", ")}`);
  }

  return NextResponse.json({ updated, failed: failures.length, failures });
}
