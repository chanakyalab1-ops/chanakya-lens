import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchGdeltCandidates } from "@/lib/gdelt";

const EXCLUDED_KEYWORDS = [
  "immigration and customs enforcement",
  "supreme court nomination",
  "election campaign rally",
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userAgent = req.headers.get("user-agent") ?? "";
  const triggeredBy = userAgent.includes("vercel-cron") ? "cron" : "manual";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let inserted = 0;
  let skipped = 0;
  let fetched = 0;
  let errorMsg: string | null = null;

  try {
    const articles = await fetchGdeltCandidates();
    fetched = articles.length;

    for (const article of articles) {
      const titleLower = article.title?.toLowerCase() ?? "";
      if (EXCLUDED_KEYWORDS.some((kw) => titleLower.includes(kw))) {
        skipped++;
        continue;
      }
      if (!article.url || !article.title) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("story_candidates").insert({
        url: article.url,
        title: article.title,
        domain: article.domain,
        source_country: article.sourcecountry,
        seen_date: parseGdeltDate(article.seendate),
        tone: article.tone,
        query_tag: article.queryTag,
      });

      if (!error) inserted++;
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  // Log this run regardless of outcome — durable record, doesn't depend on
  // Vercel's short log retention window.
  await supabase.from("ingestion_runs").insert({
    triggered_by: triggeredBy,
    fetched,
    inserted,
    skipped,
    error: errorMsg,
  });

  return NextResponse.json({ fetched, inserted, skipped, error: errorMsg });
}

function parseGdeltDate(seendate: string | undefined): string | null {
  if (!seendate) return null;
  const match = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}