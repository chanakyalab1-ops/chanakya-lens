import { supabase } from "./supabase";

import { buildTimeline, type ThreadItem } from "./threadRules";

export type { ThreadItem };

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

// The whole thread a story belongs to, oldest first. Empty for a story on its own,
// and also empty if the column has not been added yet, so a missing column never
// breaks a story page.
export async function getThread(slug: string): Promise<ThreadItem[]> {
  try {
    const { data: self, error: selfError } = await supabase.from("stories").select("thread_slug").eq("slug", slug).maybeSingle();
    if (selfError) return [];
    const root = (self as { thread_slug?: string | null } | null)?.thread_slug ?? slug;
    if (!SLUG.test(root)) return [];
    const { data, error } = await supabase.from("stories").select("slug, headline, created_at").or(`slug.eq.${root},thread_slug.eq.${root}`).order("created_at");
    if (error || !data || data.length < 2) return [];
    return buildTimeline((data as { slug: string; headline: string; created_at: string }[]).map((r) => ({ slug: r.slug, headline: r.headline, publishedAt: r.created_at })));
  } catch {
    return [];
  }
}
