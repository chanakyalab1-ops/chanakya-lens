import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resendSend = vi.fn();
vi.mock("resend", () => ({ Resend: class { emails = { send: resendSend }; } }));

import { brevoConfigured, resendConfigured, resendDailyLimit, sendEmail } from "./emailSend";

const msg = { to: "a@example.com", subject: "Hi", html: "<p>Hi</p>" };

describe("emailSend", () => {
  const env = { ...process.env };
  beforeEach(() => {
    delete process.env.BREVO_API_KEY;
    delete process.env.RESEND_DAILY_LIMIT;
    process.env.RESEND_API_KEY = "re_test";
    resendSend.mockReset();
  });
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("reports which providers are configured", () => {
    expect(resendConfigured()).toBe(true);
    expect(brevoConfigured()).toBe(false);
    process.env.BREVO_API_KEY = "xkeysib-test";
    expect(brevoConfigured()).toBe(true);
  });

  it("defaults the Resend daily limit to 99 and allows an override", () => {
    expect(resendDailyLimit()).toBe(99);
    process.env.RESEND_DAILY_LIMIT = "250";
    expect(resendDailyLimit()).toBe(250);
    process.env.RESEND_DAILY_LIMIT = "nonsense";
    expect(resendDailyLimit()).toBe(99);
  });

  it("sends through Brevo with the api-key header and the expected body", async () => {
    process.env.BREVO_API_KEY = "xkeysib-test";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ messageId: "<id1>" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(msg, "brevo")).toEqual({ ok: true, id: "<id1>" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect((init.headers as Record<string, string>)["api-key"]).toBe("xkeysib-test");
    expect(JSON.parse(init.body as string)).toMatchObject({
      sender: { email: "digest@chanakyalens.com" },
      to: [{ email: "a@example.com" }],
      subject: "Hi",
      htmlContent: "<p>Hi</p>",
    });
  });

  it("treats a Brevo bad-recipient error as non-fatal", async () => {
    process.env.BREVO_API_KEY = "k";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: "invalid_parameter", message: "bad email" }), { status: 400 })));
    expect(await sendEmail(msg, "brevo")).toEqual({ ok: false, fatal: false, error: "Brevo 400: invalid_parameter bad email" });
  });

  it("treats Brevo auth, credit and rate errors as fatal", async () => {
    process.env.BREVO_API_KEY = "k";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: "unauthorized", message: "Key not found" }), { status: 401 })));
    expect((await sendEmail(msg, "brevo")).ok).toBe(false);
    expect(await sendEmail(msg, "brevo")).toMatchObject({ fatal: true });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: "not_enough_credits", message: "Insufficient credits" }), { status: 400 })));
    expect(await sendEmail(msg, "brevo")).toMatchObject({ fatal: true });
  });

  it("sends through Resend and returns the message id", async () => {
    resendSend.mockResolvedValue({ data: { id: "r1" }, error: null });
    expect(await sendEmail(msg, "resend")).toEqual({ ok: true, id: "r1" });
    expect(resendSend).toHaveBeenCalledWith(expect.objectContaining({ to: "a@example.com", subject: "Hi" }));
  });

  it("treats Resend quota and key errors as fatal, other errors as per-recipient", async () => {
    resendSend.mockResolvedValueOnce({ data: null, error: { name: "daily_quota_exceeded", message: "quota" } });
    expect(await sendEmail(msg, "resend")).toMatchObject({ ok: false, fatal: true });
    resendSend.mockResolvedValueOnce({ data: null, error: { name: "invalid_api_key", message: "bad key" } });
    expect(await sendEmail(msg, "resend")).toMatchObject({ ok: false, fatal: true });
    resendSend.mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: "bad address" } });
    expect(await sendEmail(msg, "resend")).toMatchObject({ ok: false, fatal: false });
  });

  it("retries once after a Resend rate limit", async () => {
    vi.useFakeTimers();
    resendSend
      .mockResolvedValueOnce({ data: null, error: { name: "rate_limit_exceeded", message: "slow down" } })
      .mockResolvedValueOnce({ data: { id: "r2" }, error: null });
    const pending = sendEmail(msg, "resend");
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toEqual({ ok: true, id: "r2" });
    expect(resendSend).toHaveBeenCalledTimes(2);
  });

  it("turns a thrown error into a non-fatal failure", async () => {
    resendSend.mockRejectedValueOnce(new Error("network down"));
    expect(await sendEmail(msg, "resend")).toEqual({ ok: false, fatal: false, error: "network down" });
  });
});
