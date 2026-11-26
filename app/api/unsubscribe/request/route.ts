import { NextResponse } from "next/server";
import { cleanEmail } from "@/lib/waitlist";
import { unsubToken } from "@/lib/unsubscribeToken";
import { brevoConfigured, resendConfigured, sendEmail } from "@/lib/emailSend";

// For old digest links that have no token: emails a fresh, signed unsubscribe link
// to the address itself. The answer never reveals whether the address is subscribed.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = cleanEmail(body.email);
  if (!email) return NextResponse.json({ ok: false }, { status: 400 });
  const token = unsubToken(email);
  const provider = brevoConfigured() ? "brevo" : resendConfigured() ? "resend" : null;
  if (token && provider) {
    const link = `https://chanakyalens.com/unsubscribe?email=${encodeURIComponent(email)}&t=${token}`;
    await sendEmail(
      { to: email, subject: "Your Chanakya Lens unsubscribe link", html: `<p style="font-family:sans-serif;font-size:15px">Click to unsubscribe from the Chanakya Lens daily digest:</p><p><a href="${link}" style="font-family:sans-serif">Unsubscribe</a></p><p style="font:12px sans-serif;color:#888">If you did not ask for this, ignore this email and nothing changes.</p>` },
      provider,
    ).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
