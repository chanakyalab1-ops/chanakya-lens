import type { supabaseServer } from "./supabase-server";
import type { KnownStory } from "./duplicates";

// Everything we already have an event covered by, from the last few days:
// published stories, drafts still in the pipeline, and stories being generated
// right now. A repeat can be any of these, not only a published one.
const WINDOW_HOURS = 72;

type Client = ReturnType<typeof supabaseServer>;

type SourceLike = { url?: string | null; title?: string | null };

function fromSources(sources: unknown): { titles: string[]; urls: string[] } {
  const list = Array.isArray(sources) ? (sources as SourceLike[]) : [];
  return {
    titles: list.map((s) => s?.title ?? "").filter(Boolean),
    urls: list.map((s) => s?.url ?? "").filter(Boolean),
  };
}

export async function loadKnownStories(supabase: Client): Promise<KnownStory[]> {
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const [stories, drafts, inflight] = await Promise.all([
    supabase.from("stories").select("slug, headline, sources").gte("created_at", since),
    supabase
      .from("story_drafts")
      .select("slug, headline, articles, workflow_status")
      .gte("created_at", since)
      .in("workflow_status", ["fact_checking", "in_review"]),
    supabase.from("story_candidates").select("title, url").eq("status", "batch_pending").limit(500),
  ]);

  const known: KnownStory[] = [];

  for (const s of (stories.data ?? []) as { slug: string; headline: string; sources: unknown }[]) {
    const { titles, urls } = fromSources(s.sources);
    known.push({ slug: s.slug, headline: s.headline, state: "published", titles: [s.headline, ...titles], urls });
  }

  // A draft keeps only candidate ids, so look up the titles and links behind them.
  const draftRows = (drafts.data ?? []) as { slug: string; headline: string; articles: unknown }[];
  const ids = [
    ...new Set(
      draftRows.flatMap((d) =>
        (Array.isArray(d.articles) ? (d.articles as { candidate_id?: string }[]) : []).map((a) => a.candidate_id).filter((id): id is string => !!id),
      ),
    ),
  ];
  const byId = new Map<string, { title: string | null; url: string | null }>();
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await supabase.from("story_candidates").select("id, title, url").in("id", ids.slice(i, i + 100));
    for (const r of (data ?? []) as { id: string; title: string | null; url: string | null }[]) byId.set(r.id, r);
  }
  const publishedSlugs = new Set(known.map((k) => k.slug));
  for (const d of draftRows) {
    if (publishedSlugs.has(d.slug)) continue;
    const rows = (Array.isArray(d.articles) ? (d.articles as { candidate_id?: string }[]) : []).map((a) => byId.get(a.candidate_id ?? ""));
    known.push({
      slug: d.slug,
      headline: d.headline,
      state: "in_review",
      titles: [d.headline, ...rows.map((r) => r?.title ?? "").filter(Boolean)],
      urls: rows.map((r) => r?.url ?? "").filter(Boolean),
    });
  }

  const flying = (inflight.data ?? []) as { title: string | null; url: string | null }[];
  if (flying.length > 0) {
    known.push({
      slug: null,
      headline: "a story being generated right now",
      state: "generating",
      titles: flying.map((r) => r.title ?? "").filter(Boolean),
      urls: flying.map((r) => r.url ?? "").filter(Boolean),
    });
  }

  return known;
}
