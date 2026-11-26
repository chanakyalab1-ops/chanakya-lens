import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { validateApplication } from "@/lib/creators";

// Saves a creator-program application. A hidden "website" field catches simple bots.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.website === "string" && body.website) return NextResponse.json({ ok: true });
  const app = validateApplication(body);
  if (!app) return NextResponse.json({ ok: false, error: "Check your name, email and channel link." }, { status: 400 });
  const { error } = await supabaseServer().from("creator_applications").insert({ name: app.name, email: app.email, channel_url: app.channelUrl, audience: app.audience, note: app.note });
  if (error) return NextResponse.json({ ok: false, error: "Could not send. Try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
