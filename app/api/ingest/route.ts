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
  let result;
  let errorMsg: string | null = null;

  try {
    result = await fetchGdeltCandidates();

    for (const article of result.articles) {
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

    if (result.queriesSucceeded === 0) {
      errorMsg = `All ${result.queriesAttempted} GDELT queries failed: ${result.failureDetails.join("; ")}`;
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const fetched = result?.articles.length ?? 0;

  await supabase.from("ingestion_runs").insert({
    triggered_by: triggeredBy,
    fetched,
    inserted,
    skipped,
    error: errorMsg,
  });

  const responseBody = {
    fetched,
    inserted,
    skipped,
    queriesAttempted: result?.queriesAttempted ?? 0,
    queriesSucceeded: result?.queriesSucceeded ?? 0,
    queriesFailed: result?.queriesFailed ?? 0,
    error: errorMsg,
  };

  if (errorMsg && !result) {
    return NextResponse.json(responseBody, { status: 500 });
  }
  if (result && result.queriesSucceeded === 0) {
    return NextResponse.json(responseBody, { status: 502 });
  }
  return NextResponse.json(responseBody, { status: 200 });
}

function parseGdeltDate(seendate: string | undefined): string | null {
  if (!seendate) return null;
  const match = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}