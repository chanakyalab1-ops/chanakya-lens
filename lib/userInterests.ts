import { supabaseServer } from "./supabase-server";
import type { Interest, InterestKind } from "./interests";

// Empty when the table does not exist yet or the user follows nothing.
export async function getUserInterests(userId: string): Promise<Interest[]> {
  try {
    const { data, error } = await supabaseServer().from("watchlist_items").select("kind, slug").eq("user_id", userId).order("created_at");
    if (error || !data) return [];
    return (data as { kind: InterestKind; slug: string }[]).map((r) => ({ kind: r.kind, slug: r.slug }));
  } catch {
    return [];
  }
}
