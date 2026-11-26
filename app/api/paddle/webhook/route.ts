import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { cleanSecret, isNewerEvent, membershipRow, shouldReplaceRecord, signatureDebug, verifyPaddleSignature, type PaddleSubscription } from "@/lib/paddle";
import { sendAlert } from "@/lib/alerts";
import { createGiftFromTransaction, type PaddleTransaction } from "@/lib/giftServer";
import { sendWelcomeEmail } from "@/lib/welcomeSend";

type PaddleEvent = {
  event_type: string;
  occurred_at: string;
  data: PaddleSubscription & PaddleTransaction;
};

async function save(sub: PaddleSubscription, occurredAt: string) {
  const supabase = supabaseServer();
  let userId = sub.custom_data?.user_id;
  if (!userId) {
    // Renewals and changes carry the customer; find the member we already know.
    const { data } = await supabase.from("memberships").select("user_id").eq("provider_customer_id", sub.customer_id).maybeSingle();
    userId = (data as { user_id?: string } | null)?.user_id;
  }
  if (!userId) throw new Error(`No user for subscription ${sub.id}`);

  const { data } = await supabase.from("memberships").select("last_event_at, provider_subscription_id, status").eq("user_id", userId).maybeSingle();
  const stored = data as { last_event_at?: string; provider_subscription_id?: string; status?: string } | null;
  if (!isNewerEvent(stored?.last_event_at, occurredAt)) return;
  if (stored?.provider_subscription_id && stored.status && !shouldReplaceRecord({ provider_subscription_id: stored.provider_subscription_id, status: stored.status }, sub)) return;

  const { error } = await supabase.from("memberships").upsert(membershipRow(sub, userId, occurredAt), { onConflict: "user_id" });
  if (error) throw new Error(`Failed to save membership: ${error.message}`);

  // A reader who was not a member and now is gets a welcome email, once per change of state.
  const live = (st?: string) => st === "active" || st === "trialing";
  if (live(sub.status) && !live(stored?.status)) await sendWelcomeEmail(userId);
}

export async function POST(req: Request) {
  const rawSecret = process.env.PADDLE_WEBHOOK_SECRET;
  const secret = rawSecret ? cleanSecret(rawSecret) : "";
  if (!secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });

  const body = await req.text();
  const header = req.headers.get("paddle-signature");
  if (!verifyPaddleSignature(body, header, secret)) {
    console.error("paddle webhook bad signature", signatureDebug(header, secret));
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  const event = JSON.parse(body) as PaddleEvent;

  try {
    if (event.event_type.startsWith("subscription.")) await save(event.data, event.occurred_at);
    // A completed one-off payment for a gift makes a gift code (once per payment).
    else if (event.event_type === "transaction.completed" && event.data.custom_data?.gift) await createGiftFromTransaction(event.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await sendAlert("paddle-webhook", `${event.event_type}: ${msg}`);
    // 500 makes Paddle retry, so a brief database error does not lose a payment.
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
