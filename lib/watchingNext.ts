import { supabaseServer } from "./supabase-server";

export const WATCH_NEXT_MAX_ITEMS = 5;
export const WATCH_NEXT_ITEM_MAX = 200;

// One item per line; blank lines and stray bullets are dropped.
export function parseWatchingNext(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((l) => l.replace(/^\s*[-*•\d.)]+\s+/, "").replace(/\s+/g, " ").trim().slice(0, WATCH_NEXT_ITEM_MAX))
    .filter(Boolean)
    .slice(0, WATCH_NEXT_MAX_ITEMS);
}

// Empty when the table does not exist yet or nothing has been written.
export async function getWatchingNext(slug: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseServer().from("story_watching_next").select("items").eq("slug", slug).maybeSingle();
    if (error || !data) return [];
    return Array.isArray((data as { items: unknown }).items) ? ((data as { items: string[] }).items) : [];
  } catch {
    return [];
  }
}

export async function getWatchingNextMap(): Promise<Record<string, string[]>> {
  try {
    const { data, error } = await supabaseServer().from("story_watching_next").select("slug, items");
    if (error || !data) return {};
    return Object.fromEntries((data as { slug: string; items: string[] }[]).map((r) => [r.slug, r.items ?? []]));
  } catch {
    return {};
  }
}
