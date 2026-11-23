import { supabaseServer } from "./supabase-server";

export type Membership = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  stripeCustomerId: string;
};

// A member is anyone whose subscription is paid up or in a trial, and whose
// paid period has not run out. "past_due" is treated as not a member.
export function isActiveMember(m: Pick<Membership, "status" | "currentPeriodEnd"> | null, now = Date.now()): boolean {
  if (!m) return false;
  if (m.status !== "active" && m.status !== "trialing") return false;
  return !m.currentPeriodEnd || new Date(m.currentPeriodEnd).getTime() > now;
}

// Null when the table does not exist yet or the user has no membership.
export async function getMembership(userId: string): Promise<Membership | null> {
  try {
    const { data, error } = await supabaseServer()
      .from("memberships")
      .select("status, cancel_at_period_end, current_period_end, stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    const r = data as { status: string; cancel_at_period_end: boolean; current_period_end: string | null; stripe_customer_id: string };
    return { status: r.status, cancelAtPeriodEnd: r.cancel_at_period_end, currentPeriodEnd: r.current_period_end, stripeCustomerId: r.stripe_customer_id };
  } catch {
    return null;
  }
}
