import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { checkoutParams, membershipRow, periodEnd, verifyStripeSignature } from "./stripe";
import { isActiveMember } from "./membership";

const SECRET = "whsec_test";
const sign = (body: string, t: number, secret = SECRET) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;

describe("verifyStripeSignature", () => {
  const now = 1_700_000_000_000;
  const t = now / 1000;
  it("accepts a correct, fresh signature", () => {
    expect(verifyStripeSignature("{}", sign("{}", t), SECRET, 300, now)).toBe(true);
  });
  it("rejects a wrong secret, tampered body, stale time and missing header", () => {
    expect(verifyStripeSignature("{}", sign("{}", t, "other"), SECRET, 300, now)).toBe(false);
    expect(verifyStripeSignature('{"a":1}', sign("{}", t), SECRET, 300, now)).toBe(false);
    expect(verifyStripeSignature("{}", sign("{}", t - 1000), SECRET, 300, now)).toBe(false);
    expect(verifyStripeSignature("{}", null, SECRET, 300, now)).toBe(false);
  });
});

describe("checkoutParams", () => {
  const base = { priceId: "price_1", userId: "u1", email: "a@x.com", origin: "https://chanakyalens.com" };
  it("starts a subscription tied to the user", () => {
    const p = Object.fromEntries(checkoutParams(base));
    expect(p.mode).toBe("subscription");
    expect(p.client_reference_id).toBe("u1");
    expect(p["subscription_data[metadata][user_id]"]).toBe("u1");
    expect(p.customer_email).toBe("a@x.com");
    expect(p.customer).toBeUndefined();
  });
  it("reuses an existing customer", () => {
    const p = Object.fromEntries(checkoutParams({ ...base, customerId: "cus_1" }));
    expect(p.customer).toBe("cus_1");
    expect(p.customer_email).toBeUndefined();
  });
});

describe("membership state", () => {
  it("reads the renewal date from either place", () => {
    expect(periodEnd({ id: "s", customer: "c", status: "active", current_period_end: 1_800_000_000 })).toBe(new Date(1_800_000_000_000).toISOString());
    expect(periodEnd({ id: "s", customer: "c", status: "active", items: { data: [{ current_period_end: 1_800_000_000 }] } })).toBe(new Date(1_800_000_000_000).toISOString());
  });
  it("maps a subscription to a row", () => {
    const r = membershipRow({ id: "sub_1", customer: "cus_1", status: "active", cancel_at_period_end: true }, "u1");
    expect(r).toMatchObject({ user_id: "u1", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", status: "active", cancel_at_period_end: true, plan: "strategist" });
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
