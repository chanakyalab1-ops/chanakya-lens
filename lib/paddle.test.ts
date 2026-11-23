import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { apiBase, isNewerEvent, isSandboxToken, membershipRow, verifyPaddleSignature } from "./paddle";
import { isActiveMember } from "./membership";

const SECRET = "pdl_ntfset_test";
const sign = (body: string, ts: number, secret = SECRET) => `ts=${ts};h1=${createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex")}`;

describe("verifyPaddleSignature", () => {
  const now = 1_700_000_000_000;
  const ts = now / 1000;
  it("accepts a correct, fresh signature", () => {
    expect(verifyPaddleSignature("{}", sign("{}", ts), SECRET, 300, now)).toBe(true);
  });
  it("rejects a wrong secret, tampered body, stale time and missing header", () => {
    expect(verifyPaddleSignature("{}", sign("{}", ts, "other"), SECRET, 300, now)).toBe(false);
    expect(verifyPaddleSignature('{"a":1}', sign("{}", ts), SECRET, 300, now)).toBe(false);
    expect(verifyPaddleSignature("{}", sign("{}", ts - 1000), SECRET, 300, now)).toBe(false);
    expect(verifyPaddleSignature("{}", null, SECRET, 300, now)).toBe(false);
  });
});

describe("environment helpers", () => {
  it("picks sandbox from key and token prefixes", () => {
    expect(apiBase("pdl_sdbx_apikey_abc")).toBe("https://sandbox-api.paddle.com");
    expect(apiBase("pdl_live_apikey_abc")).toBe("https://api.paddle.com");
    expect(isSandboxToken("test_abc")).toBe(true);
    expect(isSandboxToken("live_abc")).toBe(false);
    expect(isSandboxToken(undefined)).toBe(false);
  });
});

describe("membership state", () => {
  it("maps a subscription to a row", () => {
    const r = membershipRow(
      { id: "sub_1", customer_id: "ctm_1", status: "active", current_billing_period: { ends_at: "2026-12-01T00:00:00Z" }, scheduled_change: { action: "cancel", effective_at: "2026-12-01T00:00:00Z" } },
      "u1",
      "2026-11-01T00:00:00Z"
    );
    expect(r).toMatchObject({ user_id: "u1", provider_customer_id: "ctm_1", provider_subscription_id: "sub_1", status: "active", cancel_at_period_end: true, current_period_end: "2026-12-01T00:00:00Z", plan: "strategist" });
  });
  it("ignores older webhook events", () => {
    expect(isNewerEvent(null, "2026-11-01T00:00:00Z")).toBe(true);
    expect(isNewerEvent("2026-11-02T00:00:00Z", "2026-11-01T00:00:00Z")).toBe(false);
    expect(isNewerEvent("2026-11-01T00:00:00Z", "2026-11-02T00:00:00Z")).toBe(true);
  });
  it("counts only paid or trialing, unexpired subscriptions as members", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(isActiveMember({ status: "active", currentPeriodEnd: future })).toBe(true);
    expect(isActiveMember({ status: "trialing", currentPeriodEnd: null })).toBe(true);
    expect(isActiveMember({ status: "active", currentPeriodEnd: past })).toBe(false);
    expect(isActiveMember({ status: "past_due", currentPeriodEnd: future })).toBe(false);
    expect(isActiveMember({ status: "canceled", currentPeriodEnd: future })).toBe(false);
    expect(isActiveMember(null)).toBe(false);
  });
});

import { cleanSecret, signatureDebug } from "./paddle";
describe("secret handling", () => {
  it("removes stray whitespace and quotes", () => {
    expect(cleanSecret("  pdl_ntfset_abc \n")).toBe("pdl_ntfset_abc");
    expect(cleanSecret('"pdl_ntfset_abc"')).toBe("pdl_ntfset_abc");
  });
  it("debug info never contains the secret", () => {
    const d = signatureDebug("ts=1700000000;h1=abc", "pdl_ntfset_supersecretvalue", 1_700_000_010_000);
    expect(JSON.stringify(d)).not.toContain("supersecretvalue");
    expect(d).toMatchObject({ hasHeader: true, h1Count: 1, ageSeconds: 10, secretLength: 27 });
  });
});

describe("api key cleaning", () => {
  it("accepts a pasted key with whitespace and still picks the sandbox", () => {
    const pasted = "  pdl_sdbx_apikey_abc123 \n";
    expect(apiBase(cleanSecret(pasted))).toBe("https://sandbox-api.paddle.com");
    expect(cleanSecret(pasted)).toBe("pdl_sdbx_apikey_abc123");
  });
});
