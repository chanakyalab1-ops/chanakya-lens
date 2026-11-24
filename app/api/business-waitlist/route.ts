import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { businessEmailHtml, validateBusinessSignup } from "@/lib/businessWaitlist";
import { brevoConfigured, resendConfigured, sendEmail } from "@/lib/emailSend";

// Joins the Lens+ for Business pilot list. A hidden "website" field catches simple bots.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.website === "string" && body.website) return NextResponse.json({ ok: true });
  const s = validateBusinessSignup(body);
  if (!s) return NextResponse.json({ ok: false, error: "Check your name, company and work email." }, { status: 400 });

  const db = supabaseServer();
  const { data: existing, error: readError } = await db.from("business_waitlist").select("email").eq("email", s.email).maybeSingle();
  if (readError) return NextResponse.json({ ok: false, error: "Could not save. Try again." }, { status: 500 });
  if (existing) return NextResponse.json({ ok: true });
  const { error } = await db.from("business_waitlist").insert(s);
  if (error) return NextResponse.json({ ok: false, error: "Could not save. Try again." }, { status: 500 });

  const provider = brevoConfigured() ? "brevo" : resendConfigured() ? "resend" : null;
  if (provider) await sendEmail({ to: s.email, subject: "You are on the Lens+ for Business pilot list", html: businessEmailHtml(s.name) }, provider).catch(() => {});
  return NextResponse.json({ ok: true });
}
