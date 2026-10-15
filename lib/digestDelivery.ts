import type { EmailMessage, EmailProvider, SendResult } from "./emailSend";

// Delivers the day's digest to everyone, every day. Resend's free plan allows
// about 100 emails a day, so the first `resendLimit` go through Resend and the
// rest through Brevo. If one provider stops working part-way (key rejected,
// quota used up), the people it hadn't reached move to the other provider
// instead of being dropped.

export type SendFn = (msg: EmailMessage, provider: EmailProvider) => Promise<SendResult>;

export type ProviderSummary = { attempted: number; sent: number; failed: number; stopped: string | null };

export type DeliverySummary = {
  total: number;
  sent: number;
  failed: number;
  notAttempted: number;
  failures: string[];
  resend: ProviderSummary;
  brevo: ProviderSummary;
};

type Options = { resendLimit: number; hasBrevo: boolean; hasResend: boolean };

export function splitByProvider<T>(items: T[], resendLimit: number, hasBrevo: boolean, hasResend: boolean) {
  if (hasBrevo && !hasResend) return { resend: [] as T[], brevo: items };
  if (!hasBrevo) return { resend: items, brevo: [] as T[] };
  const limit = Math.max(0, resendLimit);
  return { resend: items.slice(0, limit), brevo: items.slice(limit) };
}

async function deliver(queue: EmailMessage[], provider: EmailProvider, send: SendFn, failures: string[]) {
  const summary: ProviderSummary = { attempted: 0, sent: 0, failed: 0, stopped: null };
  for (let i = 0; i < queue.length; i++) {
    const result = await send(queue[i], provider);
    if (result.ok) {
      summary.attempted++;
      summary.sent++;
    } else if (result.fatal) {
      // The provider is refusing everything. This recipient was not really
      // tried, so hand it (and everyone after) back to the caller.
      summary.stopped = result.error;
      return { summary, rest: queue.slice(i) };
    } else {
      summary.attempted++;
      summary.failed++;
      failures.push(queue[i].to);
      console.error(`Failed to send to ${queue[i].to} via ${provider}: ${result.error}`);
    }
  }
  return { summary, rest: [] as EmailMessage[] };
}

export async function deliverDigest(prepared: EmailMessage[], send: SendFn, opts: Options): Promise<DeliverySummary> {
  const failures: string[] = [];
  const split = splitByProvider(prepared, opts.resendLimit, opts.hasBrevo, opts.hasResend);

  const first = await deliver(split.resend, "resend", send, failures);
  let brevoQueue = split.brevo;
  let notAttempted = 0;
  if (first.rest.length > 0) {
    if (opts.hasBrevo) brevoQueue = [...first.rest, ...split.brevo];
    else notAttempted += first.rest.length;
  }

  const second = await deliver(brevoQueue, "brevo", send, failures);
  notAttempted += second.rest.length;

  return {
    total: prepared.length,
    sent: first.summary.sent + second.summary.sent,
    failed: first.summary.failed + second.summary.failed,
    notAttempted,
    failures,
    resend: first.summary,
    brevo: second.summary,
  };
}
