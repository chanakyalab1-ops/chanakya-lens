import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { isOwnerEmail } from "@/lib/memberAccess";
import { getAnalyst, listPosts, STATUS_LABEL } from "@/lib/analystDesk";

// Tells a story page whether the reader is one of our analysts (or the owner), and which of
// their pieces are already about this story. Story pages are cached for everyone, so this is asked in the browser.
export async function GET(req: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const user = await getSessionUser();
  if (!user?.email) return NextResponse.json({ analyst: false }, { headers });
  const analyst = await getAnalyst(user.email);
  if (!isOwnerEmail(user.email) && !(analyst && analyst.active)) return NextResponse.json({ analyst: false }, { headers });
  const story = new URL(req.url).searchParams.get("story") ?? "";
  const mine = story ? (await listPosts({ authorEmail: user.email })).filter((p) => p.storySlug === story) : [];
  return NextResponse.json({ analyst: true, pieces: mine.map((p) => ({ id: p.id, title: p.title || "Untitled", status: p.status, label: STATUS_LABEL[p.status] })) }, { headers });
}
