import { NextResponse } from "next/server";
import { getMarketRows } from "@/lib/marketData";

// The ticker's data. The homepage itself is statically cached for an hour,
// which would freeze the prices for that long -- so the ticker fetches this
// instead. A minute of CDN caching keeps it cheap however many people load it.
export async function GET() {
  const rows = await getMarketRows();
  return NextResponse.json(
    { rows },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
