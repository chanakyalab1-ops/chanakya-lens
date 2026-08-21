import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchGdeltCandidates } from "@/lib/gdelt";

// Domestic-only / excluded categories per locked editorial scope.
// Rough keyword filter — a first pass, not a substitute for human judgment.
const EXCLUDED_KEYWORDS = [
  "immigration and customs enforcement",
  "supreme court nomination",
  "election campaign rally",
];

export async function GET(req: NextRequest) {
  // Simple shared-secret check so this endpoint can't be triggered by anyone
  // who finds the URL — only Vercel Cron (with the secret) or you, manually.
  const authHeader = req.headers.get("authorization");
  const userAgent = req.headers.get("user-agent");

  // TEMP DIAGNOSTIC — remove once cron auth issue is resolved.
  console.log("INGEST AUTH DEBUG:", {
    receivedAuthHeader: authHeader,
    expectedAuthHeader: `Bearer ${process.env.CRON_SECRET}`,
    cronSecretIsSet: !!process.env.CRON_SECRET,
    userAgent,
  });

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Uses the service_role key — this route runs server-side only, never in the browser,
  // so it's safe to use the elevated key here (unlike the public anon key used on-site).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const articles = await fetchGdeltCandidates();

  let inserted = 0;
  let skipped = 0;

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

    // Unique constraint on `url` means duplicate articles silently fail here — that's expected.
    if (!error) inserted++;
  }

  return NextResponse.json({
    fetched: articles.length,
    inserted,
    skipped,
  });
}

function parseGdeltDate(seendate: string | undefined): string | null {
  if (!seendate) return null;
  // GDELT format: "20260815T120000Z" -> ISO 8601
  const match = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}
