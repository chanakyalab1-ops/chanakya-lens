import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { getUserInterests } from "@/lib/userInterests";
import { getShelf } from "@/lib/userShelf";
import { membershipVisibleTo } from "@/lib/memberAccess";

// The homepage and story pages are cached for everyone, so a reader's own
// Watchlist and Shelf are asked for here, in the browser.
export async function GET() {
  const user = await getSessionUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user) return NextResponse.json({ signedIn: false, enabled: false, interests: [], shelf: [] }, { headers });
  // Hidden from everyone but the owner until MEMBERSHIP_PUBLIC=true.
  if (!membershipVisibleTo(user.email)) return NextResponse.json({ signedIn: true, enabled: false, interests: [], shelf: [] }, { headers });
  const [interests, shelf] = await Promise.all([getUserInterests(user.id), getShelf(user.id)]);
  return NextResponse.json({ signedIn: true, enabled: true, interests, shelf: shelf.map((s) => s.slug) }, { headers });
}
