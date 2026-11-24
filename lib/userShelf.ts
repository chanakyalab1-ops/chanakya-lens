import { supabaseServer } from "./supabase-server";

export type ShelfItem = { slug: string; note: string; createdAt: string };

// Empty when the table does not exist yet or the reader has saved nothing.
export async function getShelf(userId: string): Promise<ShelfItem[]> {
  try {
    const { data, error } = await supabaseServer()
      .from("shelf_items")
      .select("slug, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as { slug: string; note: string; created_at: string }[]).map((r) => ({ slug: r.slug, note: r.note ?? "", createdAt: r.created_at }));
  } catch {
    return [];
  }
}
