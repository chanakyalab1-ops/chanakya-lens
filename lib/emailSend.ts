import { Resend } from "resend";

// Sends one transactional email through whichever provider is configured:
// Brevo when BREVO_API_KEY is set, otherwise Resend (RESEND_API_KEY). That
// lets the provider be switched from the Vercel environment variables alone.

export type EmailMessage = { to: string; subject: string; html: string };
export type SendResult = { ok: true; id?: string } | { ok: false; error: string };
export type EmailProvider = "brevo" | "resend";

const FROM_NAME = "Chanakya Lens";
const FROM_ADDRESS = "digest@chanakyalens.com";
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export function emailProvider(): EmailProvider {
  return process.env.BREVO_API_KEY ? "brevo" : "resend";
}

// Emails a provider lets through per day. Brevo and Resend free plans differ
// (Resend: 100/day); set DIGEST_DAILY_LIMIT to match the plan actually in use.
export function dailySendLimit(): number {
  const fromEnv = Number(process.env.DIGEST_DAILY_LIMIT);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.floor(fromEnv);
  return emailProvider() === "brevo" ? 300 : 100;
}

let resendClient: Resend | null = null;

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
  if (!res.ok) return { ok: false, error: `Brevo ${res.status}: ${[body.code, body.message].filter(Boolean).join(" ")}`.trim() };
  return { ok: true, id: body.messageId };
}

async function sendWithResend(msg: EmailMessage): Promise<SendResult> {
  resendClient ??= new Resend(process.env.RESEND_API_KEY!);
  const result = await resendClient.emails.send({
    from: `${FROM_NAME} <${FROM_ADDRESS}>`,
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
  });
  if (result.error) return { ok: false, error: result.error.message };
  return { ok: true, id: result.data?.id };
}

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  try {
    return emailProvider() === "brevo" ? await sendWithBrevo(msg) : await sendWithResend(msg);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send failed" };
  }
}
