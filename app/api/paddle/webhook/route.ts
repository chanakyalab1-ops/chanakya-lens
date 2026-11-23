import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { isNewerEvent, membershipRow, verifyPaddleSignature, type PaddleSubscription } from "@/lib/paddle";
import { sendAlert } from "@/lib/alerts";

type PaddleEvent = {
  event_type: string;
  occurred_at: string;
  data: PaddleSubscription;
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

  const { data: stored } = await supabase.from("memberships").select("last_event_at").eq("user_id", userId).maybeSingle();
  if (!isNewerEvent((stored as { last_event_at?: string } | null)?.last_event_at, occurredAt)) return;

  const { error } = await supabase.from("memberships").upsert(membershipRow(sub, userId, occurredAt), { onConflict: "user_id" });
  if (error) throw new Error(`Failed to save membership: ${error.message}`);
}

export async function POST(req: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });

  const body = await req.text();
  if (!verifyPaddleSignature(body, req.headers.get("paddle-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  const event = JSON.parse(body) as PaddleEvent;

  try {
    if (event.event_type.startsWith("subscription.")) await save(event.data, event.occurred_at);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await sendAlert("paddle-webhook", `${event.event_type}: ${msg}`);
    // 500 makes Paddle retry, so a brief database error does not lose a payment.
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
