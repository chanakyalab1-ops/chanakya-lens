import { createHmac, timingSafeEqual } from "crypto";

// Paddle Billing (merchant of record). Checkout runs in the browser with
// Paddle.js; the server only handles webhooks and customer-portal links.
// Environment variables:
//   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN  client-side token ("test_..." = sandbox)
//   NEXT_PUBLIC_PADDLE_PRICE_ID      the Strategist price ("pri_...")
//   PADDLE_API_KEY                   server API key (sandbox keys contain "_sdbx")
//   PADDLE_WEBHOOK_SECRET            notification destination secret key

export function paddleConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && !!process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
}

// Client tokens start with "test_" in sandbox and "live_" in production.
export function isSandboxToken(token: string | undefined): boolean {
  return !!token && token.startsWith("test_");
}

export function apiBase(apiKey: string): string {
  return apiKey.includes("_sdbx") ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
}

export async function createPortalLink(customerId: string): Promise<string> {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("Missing PADDLE_API_KEY env var.");
  const res = await fetch(`${apiBase(key)}/customers/${encodeURIComponent(customerId)}/portal-sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: "{}",
  });
  const json = (await res.json()) as { data?: { urls?: { general?: { overview?: string } } }; error?: { detail?: string } };
  const url = json.data?.urls?.general?.overview;
  if (!res.ok || !url) throw new Error(`Paddle error (${res.status}): ${json.error?.detail ?? "no portal link"}`);
  return url;
}

export type PaddleSubscription = {
  id: string;
  customer_id: string;
  status: string;
  custom_data?: { user_id?: string } | null;
  current_billing_period?: { ends_at?: string } | null;
  scheduled_change?: { action?: string; effective_at?: string } | null;
};

export type MembershipRow = {
  user_id: string;
  provider_customer_id: string;
  provider_subscription_id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  plan: string;
  last_event_at: string;
  updated_at: string;
};

export function membershipRow(sub: PaddleSubscription, userId: string, occurredAt: string): MembershipRow {
  return {
    user_id: userId,
    provider_customer_id: sub.customer_id,
    provider_subscription_id: sub.id,
    status: sub.status,
    cancel_at_period_end: sub.scheduled_change?.action === "cancel",
    current_period_end: sub.current_billing_period?.ends_at ?? sub.scheduled_change?.effective_at ?? null,
    plan: "strategist",
    last_event_at: occurredAt,
    updated_at: new Date().toISOString(),
  };
}

// Webhooks can arrive out of order; only apply one newer than what is stored.
export function isNewerEvent(stored: string | null | undefined, incoming: string): boolean {
  if (!stored) return true;
  return new Date(incoming).getTime() >= new Date(stored).getTime();
}

// Environment values pasted into dashboards often pick up surrounding
// whitespace or quotes; neither is part of the real secret.
export function cleanSecret(raw: string): string {
  return raw.trim().replace(/^['"]|['"]$/g, "").trim();
}

// Never includes the secret: only shapes and timing, for debugging a rejected webhook.
export function signatureDebug(header: string | null, secret: string, now = Date.now()) {
  const parts = (header ?? "").split(";").map((p) => p.split("=") as [string, string]);
  const ts = Number(parts.find(([k]) => k === "ts")?.[1]);
  return {
    hasHeader: !!header,
    h1Count: parts.filter(([k]) => k === "h1").length,
    ageSeconds: Number.isFinite(ts) ? Math.round(now / 1000 - ts) : null,
    secretLength: secret.length,
    secretPrefix: secret.slice(0, 11),
  };
}

// Paddle-Signature header: "ts=<unix>;h1=<hex hmac-sha256 of `${ts}:${rawBody}`>".
export function verifyPaddleSignature(body: string, header: string | null, secret: string, toleranceSec = 300, now = Date.now()): boolean {
  if (!header) return false;
  const parts = header.split(";").map((p) => p.split("=") as [string, string]);
  const ts = parts.find(([k]) => k === "ts")?.[1];
  const sigs = parts.filter(([k]) => k === "h1").map(([, v]) => v);
  if (!ts || sigs.length === 0) return false;
  if (Math.abs(now / 1000 - Number(ts)) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
  const exp = Buffer.from(expected, "hex");
  return sigs.some((s) => {
    const got = Buffer.from(s, "hex");
    return got.length === exp.length && timingSafeEqual(got, exp);
  });
}
