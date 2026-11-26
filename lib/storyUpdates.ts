import { supabaseServer } from "./supabase-server";

export type StoryUpdate = { note: string; createdAt: string };
export const UPDATE_NOTE_MAX = 400;

export function cleanUpdateNote(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, UPDATE_NOTE_MAX) : "";
}

// Newest first. Empty when the table does not exist yet or nothing changed.
export async function getStoryUpdates(slug: string): Promise<StoryUpdate[]> {
  try {
    const { data, error } = await supabaseServer().from("story_updates").select("note, created_at").eq("slug", slug).order("created_at", { ascending: false }).limit(10);
    if (error || !data) return [];
    return (data as { note: string; created_at: string }[]).map((r) => ({ note: r.note, createdAt: r.created_at }));
  } catch {
    return [];
  }
}
