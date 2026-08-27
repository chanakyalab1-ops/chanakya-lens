import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchNewsCatcherCandidates } from "@/lib/newscatcher";

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
    result = await fetchNewsCatcherCandidates();

    const rows = result.articles
      .filter((article) => {
        const titleLower = article.title?.toLowerCase() ?? "";
        if (EXCLUDED_KEYWORDS.some((kw) => titleLower.includes(kw))) {
          skipped++;
          return false;
        }
        if (!article.url || !article.title) {
          skipped++;
          return false;
        }
        return true;
      })
      .map((article) => ({
        url: article.url,
        title: article.title,
        domain: article.domain,
        source_country: article.sourcecountry,
        seen_date: parseGdeltDate(article.seendate),
        tone: article.tone,
        query_tag: article.queryTag,
      }));

    if (rows.length > 0) {
      const { error, count } = await supabase
        .from("story_candidates")
        .upsert(rows, { onConflict: "url", ignoreDuplicates: true, count: "exact" });

      if (error) {
        errorMsg = `Batch insert failed: ${error.message}`;
      } else {
        inserted = count ?? rows.length;
      }
    }

    if (result.queriesSucceeded === 0) {
      errorMsg = `All ${result.queriesAttempted} NewsCatcher queries failed: ${result.failureDetails.join("; ")}`;
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
  // NewsCatcher dates come as "YYYY-MM-DD HH:MM:SS", already valid for Postgres timestamp
  const isoLike = seendate.replace(" ", "T") + "Z";
  const parsed = new Date(isoLike);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}
