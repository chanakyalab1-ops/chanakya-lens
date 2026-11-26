import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { cleanEmail } from "@/lib/waitlist";

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

// Saves a request for a group or classroom quote. A hidden "website" field catches simple bots.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof b.website === "string" && b.website) return NextResponse.json({ ok: true });
  const name = clip(b.name, 80);
  const email = cleanEmail(b.email);
  if (!name || !email) return NextResponse.json({ ok: false, error: "Check your name and email." }, { status: 400 });
  const { error } = await supabaseServer().from("group_plan_requests").insert({ name, email, organisation: clip(b.organisation, 100), seats: clip(b.seats, 20), note: clip(b.note, 500) });
  if (error) return NextResponse.json({ ok: false, error: "Could not send. Try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
