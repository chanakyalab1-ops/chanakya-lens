import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { getUserInterests } from "@/lib/userInterests";
import { getShelf } from "@/lib/userShelf";
import { membershipVisibleTo } from "@/lib/memberAccess";
import { supabaseServer } from "@/lib/supabase-server";
import { paidAccess } from "@/lib/entitlements";

// The homepage and story pages are cached for everyone, so a reader's own
// Watchlist and Shelf are asked for here, in the browser.
export async function GET() {
  const user = await getSessionUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user) return NextResponse.json({ signedIn: false, enabled: false, interests: [], shelf: [] }, { headers });
  // Hidden from everyone but the owner until MEMBERSHIP_PUBLIC=true.
  if (!membershipVisibleTo(user.email)) return NextResponse.json({ signedIn: true, enabled: false, interests: [], shelf: [] }, { headers });
  const [interests, shelf] = await Promise.all([getUserInterests(user.id), getShelf(user.id)]);
  let watching: string[] = [];
  try {
    const { data } = await supabaseServer().from("story_watches").select("slug").eq("user_id", user.id);
    watching = ((data ?? []) as { slug: string }[]).map((r) => r.slug);
  } catch {
    // table not created yet
  }
  return NextResponse.json({ signedIn: true, enabled: true, interests, shelf: shelf.map((s) => s.slug), watching, paid: (await paidAccess(user)) === "locked" ? "locked" : "allowed" }, { headers });
}
