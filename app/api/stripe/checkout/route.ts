import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { createCheckoutSession, stripeConfigured } from "@/lib/stripe";
import { getMembership, isActiveMember } from "@/lib/membership";

export async function POST(req: Request) {
  if (!stripeConfigured()) return NextResponse.json({ error: "Membership is not open yet." }, { status: 503 });

  const user = await getSessionUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const existing = await getMembership(user.id);
  if (isActiveMember(existing)) return NextResponse.json({ error: "You are already a member." }, { status: 409 });

  try {
    const url = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      customerId: existing?.stripeCustomerId ?? null,
      origin: new URL(req.url).origin,
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("stripe checkout failed:", e);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
