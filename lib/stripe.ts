import { createHmac, timingSafeEqual } from "crypto";

// Stripe over plain HTTPS (no SDK): checkout, billing portal, subscription
// lookups, and webhook signature checks. Keys come from environment variables
// only: STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET.

const API = "https://api.stripe.com/v1";

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID;
}

type Params = [string, string][];

async function stripeFetch<T>(path: string, method: "GET" | "POST", params?: Params): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY env var.");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? new URLSearchParams(params ?? []).toString() : undefined,
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe error (${res.status}): ${json.error?.message ?? "request failed"}`);
  return json;
}

export function checkoutParams(opts: {
  priceId: string;
  userId: string;
  email: string;
  customerId?: string | null;
  origin: string;
}): Params {
  const p: Params = [
    ["mode", "subscription"],
    ["line_items[0][price]", opts.priceId],
    ["line_items[0][quantity]", "1"],
    ["client_reference_id", opts.userId],
    ["subscription_data[metadata][user_id]", opts.userId],
    ["allow_promotion_codes", "true"],
    ["success_url", `${opts.origin}/account?membership=success`],
    ["cancel_url", `${opts.origin}/membership?canceled=1`],
  ];
  // An existing Stripe customer is reused so a returning member keeps one record.
  if (opts.customerId) p.push(["customer", opts.customerId]);
  else p.push(["customer_email", opts.email]);
  return p;
}

export async function createCheckoutSession(opts: { userId: string; email: string; customerId?: string | null; origin: string }): Promise<string> {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error("Missing STRIPE_PRICE_ID env var.");
  const s = await stripeFetch<{ url: string }>("/checkout/sessions", "POST", checkoutParams({ ...opts, priceId }));
  return s.url;
}

export async function createPortalSession(customerId: string, origin: string): Promise<string> {
  const s = await stripeFetch<{ url: string }>("/billing_portal/sessions", "POST", [
    ["customer", customerId],
    ["return_url", `${origin}/account`],
  ]);
  return s.url;
}

export type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  items?: { data?: { current_period_end?: number }[] };
  metadata?: { user_id?: string };
};

export function retrieveSubscription(id: string): Promise<StripeSubscription> {
  return stripeFetch<StripeSubscription>(`/subscriptions/${encodeURIComponent(id)}`, "GET");
}

// Stripe moved the renewal date onto the subscription item in newer API
// versions, so read either place.
export function periodEnd(sub: StripeSubscription): string | null {
  const ts = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export type MembershipRow = {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  plan: string;
  updated_at: string;
};

export function membershipRow(sub: StripeSubscription, userId: string): MembershipRow {
  return {
    user_id: userId,
    stripe_customer_id: sub.customer,
    stripe_subscription_id: sub.id,
    status: sub.status,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    current_period_end: periodEnd(sub),
    plan: "strategist",
    updated_at: new Date().toISOString(),
  };
}

// Checks the Stripe-Signature header: "t=<unix>,v1=<hex hmac of `${t}.${body}`>".
export function verifyStripeSignature(body: string, header: string | null, secret: string, toleranceSec = 300, now = Date.now()): boolean {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || sigs.length === 0) return false;
  if (Math.abs(now / 1000 - Number(t)) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  const exp = Buffer.from(expected, "hex");
  return sigs.some((s) => {
    const got = Buffer.from(s, "hex");
    return got.length === exp.length && timingSafeEqual(got, exp);
  });
}
