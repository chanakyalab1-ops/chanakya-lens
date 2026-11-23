import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { membershipRow, retrieveSubscription, verifyStripeSignature, type StripeSubscription } from "@/lib/stripe";
import { sendAlert } from "@/lib/alerts";

type StripeEvent = {
  type: string;
  data: { object: Record<string, unknown> };
};

async function save(sub: StripeSubscription, userId: string | undefined) {
  const supabase = supabaseServer();
  let uid = userId ?? sub.metadata?.user_id;
  if (!uid) {
    // Fall back to the customer we already know.
    const { data } = await supabase.from("memberships").select("user_id").eq("stripe_customer_id", sub.customer).maybeSingle();
    uid = (data as { user_id?: string } | null)?.user_id;
  }
  if (!uid) throw new Error(`No user for subscription ${sub.id}`);
  const { error } = await supabase.from("memberships").upsert(membershipRow(sub, uid), { onConflict: "user_id" });
  if (error) throw new Error(`Failed to save membership: ${error.message}`);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });

  const body = await req.text();
  if (!verifyStripeSignature(body, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  const event = JSON.parse(body) as StripeEvent;
  const obj = event.data.object;

  try {
    if (event.type === "checkout.session.completed") {
      const subId = obj.subscription as string | null;
      if (subId) await save(await retrieveSubscription(subId), (obj.client_reference_id as string | null) ?? undefined);
    } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await save(obj as unknown as StripeSubscription, undefined);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await sendAlert("stripe-webhook", `${event.type}: ${msg}`);
    // 500 makes Stripe retry, so a brief database error does not lose a payment.
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
