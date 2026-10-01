import { supabaseServer } from "@/lib/supabase-server";
import { fetchGdeltCoverage, countByCountry } from "@/lib/gdelt";
import { NextResponse } from "next/server";

// One-time backfill: populates off_lens_countries for published stories and drafts.
// Hit GET /api/backfill-off-lens-countries once after deploying, then delete this file.
// Protected by BACKFILL_SECRET env var — set it in Vercel, pass as ?secret=<value>.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!secret || secret !== process.env.BACKFILL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseServer();

  const [{ data: published, error: pubError }, { data: drafts, error: draftError }] =
    await Promise.all([
      supabase.from("stories").select("slug, headline").is("off_lens_countries", null),
      supabase.from("story_drafts").select("slug, headline").not("off_lens", "is", null).is("off_lens_countries", null),
    ]);

  if (pubError) return NextResponse.json({ error: pubError.message }, { status: 500 });
  if (draftError) return NextResponse.json({ error: draftError.message }, { status: 500 });

  const allRows = [
    ...(published ?? []).map((r) => ({ ...r, table: "stories" as const })),
    ...(drafts ?? []).map((r) => ({ ...r, table: "story_drafts" as const })),
  ];

  if (allRows.length === 0) return NextResponse.json({ updated: 0, total: 0 });

  let updated = 0;
  const failures: string[] = [];

  for (const row of allRows) {
    const articles = await fetchGdeltCoverage(row.headline);
    const countries = countByCountry(articles);

    if (Object.keys(countries).length === 0) {
      failures.push(`${row.table}:${row.slug}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from(row.table)
      .update({ off_lens_countries: countries })
      .eq("slug", row.slug);

    if (updateError) {
      failures.push(`${row.table}:${row.slug}`);
    } else {
      updated++;
    }
  }

  return NextResponse.json({ total: allRows.length, updated, failures });
}
