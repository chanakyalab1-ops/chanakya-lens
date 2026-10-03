import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  describeSources, hasEnoughCoverage, buildOffLensPrompt, parseOffLens, OFF_LENS_SYSTEM, type OffLensInput,
} from "@/lib/offLensText";

export const maxDuration = 60;

type Row = {
  slug: string;
  headline: string;
  dek: string;
  subject_countries: string[] | null;
  sources?: OffLensInput["sources"] | null;
  articles?: { candidate_id: string }[] | null;
};

// Writes the Off-Lens "Analysis" note for recently published stories that
// don't have one, from the outlets and countries already stored on the story.
//
//   /api/backfill-off-lens-text?secret=...                 dry run (default): shows the notes, writes nothing
//   /api/backfill-off-lens-text?secret=...&apply=1         saves them
//   &target=drafts   drafts waiting in review instead of published stories, so
//                    the note is in the editor's Off-Lens box before you publish
//   &hours=6     published stories from the last N hours (default 6, max 72)
//   &limit=10    items per call (max 20)       &slug=...   one specific story or draft
//
// Only fills items whose off_lens is empty, never overwrites one. Protected
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
  const drafts = params.get("target") === "drafts";
  const table = drafts ? "story_drafts" : "stories";

  const supabase = supabaseServer();
  let query = supabase
    .from(table)
    .select(drafts ? "slug, headline, dek, subject_countries, articles" : "slug, headline, dek, subject_countries, sources")
    .is("off_lens", null);
  if (drafts) {
    query = query.eq("workflow_status", "in_review");
  } else {
    query = query.order("created_at", { ascending: false });
    if (!onlySlug) query = query.gte("created_at", new Date(Date.now() - hours * 3600 * 1000).toISOString());
  }
  if (onlySlug) query = query.eq("slug", onlySlug);

  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // A draft keeps only candidate ids; the outlets live on the candidates.
  const candidates = new Map<string, OffLensInput["sources"][number]>();
  if (drafts) {
    const ids = [...new Set(((data ?? []) as unknown as Row[]).flatMap((d) => (d.articles ?? []).map((a) => a.candidate_id)))];
    if (ids.length > 0) {
      const { data: rows, error: candError } = await supabase
        .from("story_candidates")
        .select("id, url, title, domain, source_country")
        .in("id", ids);
      if (candError) return NextResponse.json({ error: candError.message }, { status: 500 });
      for (const r of rows ?? []) candidates.set(r.id, r);
    }
  }

  const results: { slug: string; status: string; offLens?: string }[] = [];
  for (const story of (data ?? []) as unknown as Row[]) {
    const input: OffLensInput = {
      headline: story.headline,
      dek: story.dek,
      subjectCountries: story.subject_countries ?? [],
      sources: drafts
        ? (story.articles ?? []).map((a) => candidates.get(a.candidate_id)).filter((c): c is NonNullable<typeof c> => !!c)
        : story.sources ?? [],
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
        .from(table)
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

  return NextResponse.json({ apply, target: drafts ? "drafts" : "stories", checked: results.length, results });
}
