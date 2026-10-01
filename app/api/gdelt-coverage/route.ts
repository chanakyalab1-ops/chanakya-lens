import { NextRequest, NextResponse } from "next/server";
import { fetchGdeltCoverage, countByCountry } from "@/lib/gdelt";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({}, { status: 400 });

  let articles;
  try {
    articles = await fetchGdeltCoverage(q);
  } catch (err) {
    console.error("[gdelt-coverage] fetch threw:", err);
    return NextResponse.json(
      { _error: "gdelt_fetch_failed", _reason: String(err) },
      { status: 502 }
    );
  }

  if (articles.length === 0) {
    console.log(`[gdelt-coverage] 0 articles for: ${q}`);
    return NextResponse.json({});
  }

  const countries = countByCountry(articles);
  console.log(`[gdelt-coverage] ${articles.length} articles, countries:`, Object.keys(countries).join(", "));
  return NextResponse.json(countries);
}
