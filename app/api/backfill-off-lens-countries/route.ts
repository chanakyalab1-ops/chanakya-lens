import { supabaseServer } from "@/lib/supabase-server";
import { fetchGdeltCoverage, countByCountry } from "@/lib/gdelt";
import { NextResponse } from "next/server";

// One-time backfill: populates off_lens_countries for drafts that have off_lens but no country data.
// Hit GET /api/backfill-off-lens-countries once after deploying, then delete this file.
// Protected by BACKFILL_SECRET env var — set it in Vercel, pass as ?secret=<value>.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!secret || secret !== process.env.BACKFILL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseServer();

  const { data: drafts, error } = await supabase
    .from("story_drafts")
    .select("slug, headline")
    .not("off_lens", "is", null)
    .is("off_lens_countries", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!drafts || drafts.length === 0) return NextResponse.json({ updated: 0 });

  let updated = 0;
  const failures: string[] = [];

  for (const draft of drafts) {
    const articles = await fetchGdeltCoverage(draft.headline);
    const countries = countByCountry(articles);

    if (Object.keys(countries).length === 0) {
      failures.push(draft.slug);
      continue;
    }

    const { error: updateError } = await supabase
      .from("story_drafts")
      .update({ off_lens_countries: countries })
      .eq("slug", draft.slug);

    if (updateError) {
      failures.push(draft.slug);
    } else {
      updated++;
    }
  }

  return NextResponse.json({ total: drafts.length, updated, failures });
}
