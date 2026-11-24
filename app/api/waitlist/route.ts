import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { cleanEmail, cleanSource, waitlistEmailHtml } from "@/lib/waitlist";
import { brevoConfigured, resendConfigured, sendEmail } from "@/lib/emailSend";

// Joins the Lens+ waitlist. A hidden "website" field catches simple bots. The
// confirmation email goes out only the first time an address joins.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; website?: unknown; source?: unknown };
  if (typeof body.website === "string" && body.website) return NextResponse.json({ ok: true });
  const email = cleanEmail(body.email);
  if (!email) return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });

  const db = supabaseServer();
  const { data: existing, error: readError } = await db.from("lens_plus_waitlist").select("email").eq("email", email).maybeSingle();
  if (readError) return NextResponse.json({ ok: false, error: "Could not save. Try again." }, { status: 500 });
  if (existing) return NextResponse.json({ ok: true });

  const { error } = await db.from("lens_plus_waitlist").insert({ email, source: cleanSource(body.source) });
  if (error) return NextResponse.json({ ok: false, error: "Could not save. Try again." }, { status: 500 });

  const provider = brevoConfigured() ? "brevo" : resendConfigured() ? "resend" : null;
  if (provider) await sendEmail({ to: email, subject: "You are on the Lens+ waitlist", html: waitlistEmailHtml() }, provider).catch(() => {});
  return NextResponse.json({ ok: true });
}
