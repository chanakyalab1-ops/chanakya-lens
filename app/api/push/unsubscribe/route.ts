import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { endpoint?: unknown };
  if (typeof body.endpoint !== "string") return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const { error } = await supabaseServer().from("push_subscriptions").delete().eq("endpoint", body.endpoint);
  if (error) return NextResponse.json({ error: "Could not remove." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
