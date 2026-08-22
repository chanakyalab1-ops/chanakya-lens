import { supabase } from "./supabase";

export async function logPageView(path: string) {
  try {
    await supabase.from("page_views").insert({ path });
  } catch {
    // silently ignore — never let analytics break a page render
  }
}
