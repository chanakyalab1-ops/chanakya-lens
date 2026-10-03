import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  describeSources, hasEnoughCoverage, buildOffLensPrompt, parseOffLens, OFF_LENS_SYSTEM, type OffLensInput,
} from "@/lib/offLensText";

export const maxDuration = 60;

type StoryRow = {
  slug: string;
  headline: string;
  dek: string;
  created_at: string;
  subject_countries: string[] | null;
  sources: OffLensInput["sources"] | null;
};

// Writes the Off-Lens "Analysis" note for recently published stories that
// don't have one, from the outlets and countries already stored on the story.
//
//   /api/backfill-off-lens-text?secret=...                 dry run (default): shows the notes, writes nothing
//   /api/backfill-off-lens-text?secret=...&apply=1         saves them
//   &hours=6     stories published in the last N hours (default 6, max 72)
//   &limit=10    stories per call (max 20)       &slug=...   one specific story
//
// Only fills stories whose off_lens is empty, never overwrites one. Protected
// by BACKFILL_SECRET.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const secret = params.get("secret");
  if (!secret || secret !== process.env.BACKFILL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });

  const apply = params.get("apply") === "1";
  const hours = Math.min(Math.max(Number(params.get("hours") ?? 6) || 6, 1), 72);
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 10) || 10, 1), 20);
  const onlySlug = params.get("slug");

  const supabase = supabaseServer();
  let query = supabase
    .from("stories")
    .select("slug, headline, dek, created_at, subject_countries, sources")
    .is("off_lens", null)
    .order("created_at", { ascending: false });
  query = onlySlug
    ? query.eq("slug", onlySlug)
    : query.gte("created_at", new Date(Date.now() - hours * 3600 * 1000).toISOString());

  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { slug: string; status: string; offLens?: string }[] = [];
  for (const story of (data ?? []) as StoryRow[]) {
    const input: OffLensInput = {
      headline: story.headline,
      dek: story.dek,
      subjectCountries: story.subject_countries ?? [],
      sources: story.sources ?? [],
    };
    const sources = describeSources(input.sources);
    if (!hasEnoughCoverage(sources)) {
      results.push({ slug: story.slug, status: "skipped: fewer than 2 countries covering it" });
      continue;
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: OFF_LENS_SYSTEM,
        messages: [{ role: "user", content: buildOffLensPrompt(input, sources) }],
      }),
    });
    if (!res.ok) {
      results.push({ slug: story.slug, status: `error: Anthropic ${res.status}` });
      continue;
    }
    const json = await res.json();
    const text = (json.content ?? []).map((b: { text?: string }) => b.text ?? "").join("");
    const note = parseOffLens(text);
    if (!note) {
      results.push({ slug: story.slug, status: "no real gap or divergence" });
      continue;
    }

    if (apply) {
      const { error: updateError } = await supabase
        .from("stories")
        .update({ off_lens: note })
        .eq("slug", story.slug)
        .is("off_lens", null);
      if (updateError) {
        results.push({ slug: story.slug, status: `error: ${updateError.message}` });
        continue;
      }
    }
    results.push({ slug: story.slug, status: apply ? "saved" : "proposed", offLens: note });
  }

  return NextResponse.json({ apply, hours, checked: results.length, results });
}
