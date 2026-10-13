import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resendSend = vi.fn();
vi.mock("resend", () => ({ Resend: class { emails = { send: resendSend }; } }));

import { dailySendLimit, emailProvider, sendEmail } from "./emailSend";

const msg = { to: "a@example.com", subject: "Hi", html: "<p>Hi</p>" };

describe("emailSend", () => {
  const env = { ...process.env };
  beforeEach(() => {
    delete process.env.BREVO_API_KEY;
    delete process.env.DIGEST_DAILY_LIMIT;
    process.env.RESEND_API_KEY = "re_test";
    resendSend.mockReset();
  });
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it("picks the provider from the environment", () => {
    expect(emailProvider()).toBe("resend");
    process.env.BREVO_API_KEY = "xkeysib-test";
    expect(emailProvider()).toBe("brevo");
  });

  it("uses provider defaults for the daily limit, overridable by env", () => {
    expect(dailySendLimit()).toBe(100);
    process.env.BREVO_API_KEY = "k";
    expect(dailySendLimit()).toBe(300);
    process.env.DIGEST_DAILY_LIMIT = "250";
    expect(dailySendLimit()).toBe(250);
  });

  it("sends through Brevo with the api-key header and the expected body", async () => {
    process.env.BREVO_API_KEY = "xkeysib-test";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ messageId: "<id1>" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(msg)).toEqual({ ok: true, id: "<id1>" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect((init.headers as Record<string, string>)["api-key"]).toBe("xkeysib-test");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ sender: { email: "digest@chanakyalens.com" }, to: [{ email: "a@example.com" }], subject: "Hi", htmlContent: "<p>Hi</p>" });
  });

  it("returns the Brevo error code and message on failure", async () => {
    process.env.BREVO_API_KEY = "xkeysib-test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: "not_enough_credits", message: "Insufficient credits" }), { status: 400 })));
    expect(await sendEmail(msg)).toEqual({ ok: false, error: "Brevo 400: not_enough_credits Insufficient credits" });
  });

  it("falls back to Resend when no Brevo key is set", async () => {
    resendSend.mockResolvedValue({ data: { id: "r1" }, error: null });
    expect(await sendEmail(msg)).toEqual({ ok: true, id: "r1" });
    expect(resendSend).toHaveBeenCalledWith(expect.objectContaining({ to: "a@example.com", subject: "Hi" }));
  });

  it("turns a Resend error or a thrown error into a failed result", async () => {
    resendSend.mockResolvedValueOnce({ data: null, error: { message: "daily quota exceeded" } });
    expect(await sendEmail(msg)).toEqual({ ok: false, error: "daily quota exceeded" });
    resendSend.mockRejectedValueOnce(new Error("network down"));
    expect(await sendEmail(msg)).toEqual({ ok: false, error: "network down" });
  });
});
