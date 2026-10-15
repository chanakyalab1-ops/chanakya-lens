import { Resend } from "resend";

// Sends one transactional email through a named provider. Each result says
// whether a failure is "fatal" -- the provider is refusing everything (bad or
// restricted key, quota used up, sender not allowed) -- or just about this one
// recipient, so the caller can stop using a broken provider without giving up
// on the rest of the list over one bad address.

export type EmailMessage = { to: string; subject: string; html: string };
export type EmailProvider = "brevo" | "resend";
export type SendResult = { ok: true; id?: string } | { ok: false; error: string; fatal: boolean };

const FROM_NAME = "Chanakya Lens";
const FROM_ADDRESS = "digest@chanakyalens.com";
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

// Resend free plan: 100 emails a day. Stay one under it.
export const DEFAULT_RESEND_DAILY_LIMIT = 99;

export function brevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function resendDailyLimit(): number {
  const fromEnv = Number(process.env.RESEND_DAILY_LIMIT);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? Math.floor(fromEnv) : DEFAULT_RESEND_DAILY_LIMIT;
}

const RESEND_FATAL = new Set([
  "missing_api_key",
  "restricted_api_key",
  "invalid_api_key",
  "daily_quota_exceeded",
  "monthly_quota_exceeded",
  "invalid_from_address",
]);

const BREVO_FATAL_CODES = new Set(["unauthorized", "permission_denied", "not_enough_credits", "account_under_validation"]);

let resendClient: Resend | null = null;
export const RATE_LIMIT_WAIT_MS = 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendWithBrevo(msg: EmailMessage): Promise<SendResult> {
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_ADDRESS },
      to: [{ email: msg.to }],
      subject: msg.subject,
      htmlContent: msg.html,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { messageId?: string; code?: string; message?: string };
  if (res.ok) return { ok: true, id: body.messageId };
  const fatal = res.status === 401 || res.status === 403 || res.status === 429 || BREVO_FATAL_CODES.has(body.code ?? "");
  return { ok: false, fatal, error: `Brevo ${res.status}: ${[body.code, body.message].filter(Boolean).join(" ")}`.trim() };
}

async function sendWithResend(msg: EmailMessage): Promise<SendResult> {
  resendClient ??= new Resend(process.env.RESEND_API_KEY!);
  const payload = { from: `${FROM_NAME} <${FROM_ADDRESS}>`, to: msg.to, subject: msg.subject, html: msg.html };
  let result = await resendClient.emails.send(payload);
  if (result.error?.name === "rate_limit_exceeded") {
    await sleep(RATE_LIMIT_WAIT_MS);
    result = await resendClient.emails.send(payload);
  }
  if (!result.error) return { ok: true, id: result.data?.id };
  return { ok: false, fatal: RESEND_FATAL.has(result.error.name), error: `${result.error.name}: ${result.error.message}` };
}

export async function sendEmail(msg: EmailMessage, provider: EmailProvider): Promise<SendResult> {
  try {
    return provider === "brevo" ? await sendWithBrevo(msg) : await sendWithResend(msg);
  } catch (err) {
    // A thrown error (network down, bad config) is about the provider, not the recipient.
    return { ok: false, fatal: false, error: err instanceof Error ? err.message : "send failed" };
  }
}
