import { describe, expect, it } from "vitest";
import { deliverDigest, splitByProvider, type SendFn } from "./digestDelivery";

const people = (n: number) => Array.from({ length: n }, (_, i) => ({ to: `u${i}@example.com`, subject: "s", html: "h" }));

describe("splitByProvider", () => {
  it("puts the first N on Resend and the rest on Brevo when both exist", () => {
    const { resend, brevo } = splitByProvider([1, 2, 3, 4, 5], 3, true, true);
    expect(resend).toEqual([1, 2, 3]);
    expect(brevo).toEqual([4, 5]);
  });
  it("sends everything through Resend when Brevo isn't configured", () => {
    expect(splitByProvider([1, 2, 3], 2, false, true)).toEqual({ resend: [1, 2, 3], brevo: [] });
  });
  it("sends everything through Brevo when Resend isn't configured", () => {
    expect(splitByProvider([1, 2, 3], 2, true, false)).toEqual({ resend: [], brevo: [1, 2, 3] });
  });
  it("keeps 105 subscribers daily: 99 on Resend, 6 on Brevo", () => {
    const { resend, brevo } = splitByProvider(people(105), 99, true, true);
    expect(resend).toHaveLength(99);
    expect(brevo).toHaveLength(6);
  });
});

describe("deliverDigest", () => {
  const opts = { resendLimit: 99, hasBrevo: true, hasResend: true };

  it("delivers 105 emails to everyone, 99 via Resend and 6 via Brevo", async () => {
    const used: Record<string, number> = { resend: 0, brevo: 0 };
    const send: SendFn = async (_m, p) => { used[p]++; return { ok: true }; };
    const out = await deliverDigest(people(105), send, opts);
    expect(used).toEqual({ resend: 99, brevo: 6 });
    expect(out).toMatchObject({ total: 105, sent: 105, failed: 0, notAttempted: 0 });
  });

  it("skips a bad recipient and keeps going", async () => {
    const send: SendFn = async (m) => (m.to === "u3@example.com" ? { ok: false, fatal: false, error: "bad address" } : { ok: true });
    const out = await deliverDigest(people(10), send, opts);
    expect(out.sent).toBe(9);
    expect(out.failed).toBe(1);
    expect(out.failures).toEqual(["u3@example.com"]);
    expect(out.notAttempted).toBe(0);
  });

  it("moves the rest to Brevo when Resend hits its quota part-way, without counting it as failed", async () => {
    let resendCalls = 0;
    const send: SendFn = async (_m, p) => {
      if (p === "resend") {
        resendCalls++;
        if (resendCalls > 4) return { ok: false, fatal: true, error: "daily_quota_exceeded: quota" };
      }
      return { ok: true };
    };
    const out = await deliverDigest(people(10), send, opts);
    expect(out.resend).toMatchObject({ sent: 4, stopped: "daily_quota_exceeded: quota" });
    expect(out.brevo.sent).toBe(6);
    expect(out).toMatchObject({ sent: 10, failed: 0, notAttempted: 0 });
  });

  it("reports the people it could not reach when the only provider stops", async () => {
    const send: SendFn = async () => ({ ok: false, fatal: true, error: "invalid_api_key: bad" });
    const out = await deliverDigest(people(5), send, { resendLimit: 99, hasBrevo: false, hasResend: true });
    expect(out).toMatchObject({ sent: 0, failed: 0, notAttempted: 5 });
    expect(out.resend.stopped).toContain("invalid_api_key");
  });

  it("does not drop the Resend group when Brevo is down", async () => {
    const send: SendFn = async (_m, p) => (p === "brevo" ? { ok: false, fatal: true, error: "Brevo 401" } : { ok: true });
    const out = await deliverDigest(people(105), send, opts);
    expect(out.resend.sent).toBe(99);
    expect(out).toMatchObject({ sent: 99, notAttempted: 6 });
  });
});
