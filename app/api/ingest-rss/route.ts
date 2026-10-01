import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchRssCandidates } from "@/lib/rss";
import { isExcluded } from "@/lib/ingestFilters";
import { sendAlert } from "@/lib/alerts";

export const maxDuration = 120;

const UPSERT_CHUNK = 500;

// Wide ingest: ~100 outlet feeds across ~40 countries. Free and unmetered,
// unlike the keyword-search APIs, so one run collects the same story from
// many outlets -- which is what lets a story carry 10+ sources.
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
  let errorMsg: string | null = null;
  let result;

  try {
    result = await fetchRssCandidates();

    const rows = result.articles
      .filter((a) => {
        if (isExcluded(a.title)) {
          skipped++;
          return false;
        }
        return true;
      })
      .map((a) => ({
        url: a.url,
        title: a.title,
        domain: a.domain,
        source_country: a.sourcecountry,
        seen_date: a.seendate,
        tone: 0,
        query_tag: "rss",
      }));

    for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
      const chunk = rows.slice(i, i + UPSERT_CHUNK);
      const { error, count } = await supabase
        .from("story_candidates")
        .upsert(chunk, { onConflict: "url", ignoreDuplicates: true, count: "exact" });
      if (error) {
        errorMsg = `Batch insert failed: ${error.message}`;
        break;
      }
      inserted += count ?? chunk.length;
    }

    // A few dead feeds is normal; most of them failing means something
    // systemic (network, a bad deploy) and is worth an alert.
    if (result.queriesSucceeded < result.queriesAttempted / 2) {
      errorMsg = `Only ${result.queriesSucceeded}/${result.queriesAttempted} RSS feeds responded: ${result.failureDetails.slice(0, 5).join("; ")}`;
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

  if (errorMsg) {
    await sendAlert("ingest-rss", errorMsg);
  }

  return NextResponse.json(
    {
      fetched,
      inserted,
      skipped,
      feedsAttempted: result?.queriesAttempted ?? 0,
      feedsSucceeded: result?.queriesSucceeded ?? 0,
      feedsFailed: result?.queriesFailed ?? 0,
      failedFeeds: result?.failureDetails ?? [],
      error: errorMsg,
    },
    { status: errorMsg && !result ? 500 : 200 }
  );
}
