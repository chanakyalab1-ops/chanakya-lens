import { supabaseServer } from "./supabase-server";
import { apiBase, cleanSecret } from "./paddle";
import { generateGiftCode, giftEmailHtml, giftPeriodEnd, GIFT_MONTHS, normalizeGiftCode } from "./gifts";
import { cleanEmail } from "./waitlist";
import { brevoConfigured, resendConfigured, sendEmail } from "./emailSend";
import { sendAlert } from "./alerts";
import { sendWelcomeEmail } from "./welcomeSend";

export type PaddleTransaction = { id: string; customer_id?: string | null; custom_data?: { gift?: string; email?: string } | null };

async function buyerEmail(customerId: string | null | undefined): Promise<string> {
  const key = cleanSecret(process.env.PADDLE_API_KEY ?? "");
  if (!key || !customerId) return "";
  try {
    const res = await fetch(`${apiBase(key)}/customers/${encodeURIComponent(customerId)}`, { headers: { Authorization: `Bearer ${key}` } });
    const json = (await res.json()) as { data?: { email?: string } };
    return json.data?.email ?? "";
  } catch {
    return "";
  }
}

// Called from the Paddle webhook when a gift payment completes: makes the code once
// per payment (Paddle can resend events) and emails it to the buyer.
export async function createGiftFromTransaction(txn: PaddleTransaction): Promise<void> {
  const db = supabaseServer();
  const { data: existing } = await db.from("gift_codes").select("code").eq("paddle_transaction_id", txn.id).maybeSingle();
  if (existing) return;

  const code = generateGiftCode();
  // The address typed on our gift page rides along with the payment; Paddle's customer record is the backup.
  const email = cleanEmail(txn.custom_data?.email) ?? (await buyerEmail(txn.customer_id));
  const { error } = await db.from("gift_codes").insert({ code, paddle_transaction_id: txn.id, buyer_email: email, months: GIFT_MONTHS });
  if (error) throw new Error(`Could not save gift code: ${error.message}`);

  const provider = brevoConfigured() ? "brevo" : resendConfigured() ? "resend" : null;
  const sent = email && provider ? await sendEmail({ to: email, subject: "Your Lens+ gift code", html: giftEmailHtml(code) }, provider).catch(() => ({ ok: false })) : { ok: false };
  // If the email could not go out, tell the owner so the buyer is never left without their code.
  if (!sent.ok) await sendAlert("gift-code", `A gift was paid for (${txn.id}) but the code email did not send to "${email || "unknown"}". Code: ${code}`);
}

export type RedeemResult = { ok: true; endsAt: string } | { ok: false; error: string };

export async function redeemGiftCode(userId: string, rawCode: string): Promise<RedeemResult> {
  const code = normalizeGiftCode(rawCode);
  if (!code) return { ok: false, error: "That does not look like a gift code." };
  const db = supabaseServer();

  const { data: m } = await db.from("memberships").select("status, current_period_end, provider_subscription_id").eq("user_id", userId).maybeSingle();
  const mem = m as { status: string; current_period_end: string | null; provider_subscription_id: string } | null;
  const live = mem && (mem.status === "active" || mem.status === "trialing") && (!mem.current_period_end || new Date(mem.current_period_end) > new Date());
  if (live && !mem.provider_subscription_id.startsWith("gift:")) {
    return { ok: false, error: "You already have an active Lens+ subscription. Keep this code for someone else." };
  }

  // Claim the code first so two people cannot redeem it at once.
  const { data: claimed, error: claimError } = await db
    .from("gift_codes")
    .update({ redeemed_by: userId, redeemed_at: new Date().toISOString() })
    .eq("code", code)
    .is("redeemed_by", null)
    .select("code, months");
  if (claimError) return { ok: false, error: "Could not check that code. Try again." };
  if (!claimed || claimed.length === 0) {
    const { data: row } = await db.from("gift_codes").select("redeemed_at").eq("code", code).maybeSingle();
    return { ok: false, error: row ? "That code has already been used." : "That code is not valid." };
  }

  const now = new Date();
  const end = giftPeriodEnd(now, live ? mem.current_period_end : null, (claimed[0] as { months: number }).months);
  const { error } = await db.from("memberships").upsert(
    {
      user_id: userId,
      provider_customer_id: `gift:${code}`,
      provider_subscription_id: `gift:${code}`,
      status: "active",
      cancel_at_period_end: true,
      current_period_end: end.toISOString(),
      plan: "gift",
      last_event_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    await db.from("gift_codes").update({ redeemed_by: null, redeemed_at: null }).eq("code", code);
    return { ok: false, error: "Could not add Lens+ to your account. Try again." };
  }
  await sendWelcomeEmail(userId, { gift: true, endsAt: end.toISOString() });
  return { ok: true, endsAt: end.toISOString() };
}

// Sends a gift code (again) to an address. Owner tool; the code must already exist.
export async function resendGiftCode(rawCode: string, toEmail: string): Promise<{ ok: boolean; error?: string }> {
  const code = normalizeGiftCode(rawCode);
  const to = cleanEmail(toEmail);
  if (!code || !to) return { ok: false, error: "Check the code and the email address." };
  const { data } = await supabaseServer().from("gift_codes").select("code").eq("code", code).maybeSingle();
  if (!data) return { ok: false, error: "No such code." };
  const provider = brevoConfigured() ? "brevo" : resendConfigured() ? "resend" : null;
  if (!provider) return { ok: false, error: "No email provider is set up." };
  const r = await sendEmail({ to, subject: "Your Lens+ gift code", html: giftEmailHtml(code) }, provider);
  return r.ok ? { ok: true } : { ok: false, error: "The email provider refused it." };
}
