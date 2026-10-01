import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { searchGoogleNews } from "@/lib/googleNews";
import { buildQuery, matchHits, countryCounts, nextOffset, type BackfillSource } from "@/lib/sourceBackfill";
import { MAX_SOURCES_FOR_STORY } from "@/lib/clustering";
import { canonicalDomain } from "@/lib/outletCountries";

export const maxDuration = 60;

type StoryRow = {
  slug: string;
  headline: string;
  created_at: string;
  sources: (BackfillSource | { url: string; title: string; domain: string; source_country: string | null; role: string })[] | null;
  off_lens_countries: Record<string, number> | null;
};

// Adds sources to published stories that have too few, by searching Google
// News for the same event around the story's publish date.
//
//   /api/backfill-sources?secret=...                   dry run (default): shows matches, writes nothing
//   /api/backfill-sources?secret=...&apply=1           writes the matches
//   &limit=5     stories per call (max 15)     &offset=0   continue where the last call stopped
//   &min=8       only stories with fewer sources than this
//   &slug=...    one specific story
//
// Protected by BACKFILL_SECRET (same as the other backfill routes). One-time
// tool: delete the route once the backlog is done.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const secret = params.get("secret");
  if (!secret || secret !== process.env.BACKFILL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apply = params.get("apply") === "1";
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 5) || 5, 1), 15);
  const offset = Math.max(Number(params.get("offset") ?? 0) || 0, 0);
  const min = Math.max(Number(params.get("min") ?? 8) || 8, 1);
  const onlySlug = params.get("slug");

  const supabase = supabaseServer();
  let query = supabase
    .from("stories")
    .select("slug, headline, created_at, sources, off_lens_countries")
    .order("created_at", { ascending: false });
  if (onlySlug) query = query.eq("slug", onlySlug);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const eligible = ((data ?? []) as StoryRow[]).filter((s) => onlySlug || (s.sources?.length ?? 0) < min);
  const batch = eligible.slice(offset, offset + limit);

  const results = [];
  for (const story of batch) {
    const existing = story.sources ?? [];
    const room = MAX_SOURCES_FOR_STORY - existing.length;
    const existingDomains = new Set(existing.map((s) => canonicalDomain(s.domain)));

    let hits = await searchGoogleNews(buildQuery(story.headline, story.created_at));
    // Every extra term narrows a Google search, so a niche headline can match
    // nothing at all. Retry once with just the two strongest terms.
    if (hits.length === 0) hits = await searchGoogleNews(buildQuery(story.headline, story.created_at, 2));
    const matches = matchHits(story.headline, story.created_at, hits, existingDomains, room);
    // A story with no sources yet needs a lead one for its photo credit.
    const added: BackfillSource[] = matches.map((m, i) => ({
      url: m.url,
      title: m.title,
      domain: m.domain,
      source_country: m.source_country,
      role: existing.length === 0 && i === 0 ? "primary" : "source",
    }));

    let written = false;
    let writeError: string | null = null;
    if (apply && added.length > 0) {
      const merged = [...existing, ...added];
      const update: Record<string, unknown> = { sources: merged };
      // Only fill the Off-Lens country bar where nothing is stored yet.
      if (!story.off_lens_countries || Object.keys(story.off_lens_countries).length === 0) {
        const counts = countryCounts(merged);
        if (Object.keys(counts).length > 0) update.off_lens_countries = counts;
      }
      const { error: updateError } = await supabase.from("stories").update(update).eq("slug", story.slug);
      if (updateError) writeError = updateError.message;
      else written = true;
    }

    results.push({
      slug: story.slug,
      headline: story.headline,
      before: existing.length,
      searched: hits.length,
      added: matches.map((m) => ({ domain: m.domain, country: m.source_country, similarity: m.similarity, title: m.title })),
      after: existing.length + added.length,
      written,
      error: writeError,
    });

    // Be gentle with Google.
    await new Promise((r) => setTimeout(r, 1000));
  }

  return NextResponse.json({
    mode: apply ? "apply" : "dry-run",
    eligible: eligible.length,
    processed: batch.length,
    nextOffset: nextOffset(offset, results, apply, min, eligible.length),
    results,
  });
}
