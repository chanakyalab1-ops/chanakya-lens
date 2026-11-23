import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { createPortalSession, stripeConfigured } from "@/lib/stripe";
import { getMembership } from "@/lib/membership";

export async function POST(req: Request) {
  if (!stripeConfigured()) return NextResponse.json({ error: "Membership is not open yet." }, { status: 503 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const m = await getMembership(user.id);
  if (!m) return NextResponse.json({ error: "No membership found." }, { status: 404 });

  try {
    const url = await createPortalSession(m.stripeCustomerId, new URL(req.url).origin);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("stripe portal failed:", e);
    return NextResponse.json({ error: "Could not open billing." }, { status: 500 });
  }
}
