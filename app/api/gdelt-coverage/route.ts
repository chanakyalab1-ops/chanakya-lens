import { NextRequest, NextResponse } from "next/server";
import { fetchGdeltCoverage, countByCountry } from "@/lib/gdelt";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({}, { status: 400 });

  const articles = await fetchGdeltCoverage(q);
  const countries = countByCountry(articles);
  return NextResponse.json(countries);
}
