import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { supabaseServer } from "@/lib/supabase-server";
import { membershipVisibleTo } from "@/lib/memberAccess";

// Records that a signed-in reader opened a story, for their Reading Map.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !membershipVisibleTo(user.email)) return NextResponse.json({ ok: false });
  const { slug } = (await req.json().catch(() => ({}))) as { slug?: unknown };
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,200}$/.test(slug)) return NextResponse.json({ ok: false }, { status: 400 });
  const { error } = await supabaseServer().from("story_reads").upsert({ user_id: user.id, slug, read_at: new Date().toISOString() }, { onConflict: "user_id,slug" });
  return NextResponse.json({ ok: !error });
}
