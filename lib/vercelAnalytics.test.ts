import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getVercelTraffic, sumRows, toReferrers } from "./vercelAnalytics";

describe("vercelAnalytics helpers", () => {
  it("sums rows and ignores non-numeric values", () => {
    expect(sumRows([{ pageviews: 10, visitors: 4 }, { pageviews: "x", visitors: 1 }])).toEqual({ pageviews: 10, visitors: 5 });
    expect(sumRows([])).toEqual({ pageviews: 0, visitors: 0 });
  });

  it("labels empty referrers and sorts by pageviews", () => {
    const out = toReferrers([
      { referrerHostname: "", pageviews: 5, visitors: 4 },
      { referrerHostname: "google.com", pageviews: 9, visitors: 7 },
    ]);
    expect(out.map((r) => r.host)).toEqual(["google.com", "Direct / unknown"]);
  });
});

describe("getVercelTraffic", () => {
  const env = { ...process.env };
  beforeEach(() => {
    delete process.env.VERCEL_ANALYTICS_TOKEN;
    delete process.env.VERCEL_PROJECT_ID;
    delete process.env.VERCEL_TEAM_ID;
  });
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it("reports unconfigured without credentials", async () => {
    expect(await getVercelTraffic()).toEqual({ status: "unconfigured" });
  });

  it("returns totals and referrers, sending the token and team", async () => {
    process.env.VERCEL_ANALYTICS_TOKEN = "tok";
    process.env.VERCEL_PROJECT_ID = "prj_1";
    process.env.VERCEL_TEAM_ID = "team_1";
    const fetchMock = vi.fn(async (url: string) => {
      const by = new URL(url).searchParams.get("by");
      const data = by === "referrerHostname" ? [{ referrerHostname: "t.co", pageviews: 3, visitors: 2 }] : [{ pageviews: 12, visitors: 8 }];
      return new Response(JSON.stringify({ data }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const out = await getVercelTraffic(1_000_000_000_000);
    expect(out).toEqual({ status: "ok", day: { pageviews: 12, visitors: 8 }, month: { pageviews: 12, visitors: 8 }, referrers: [{ host: "t.co", pageviews: 3, visitors: 2 }] });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get("teamId")).toBe("team_1");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("returns an error status when the API rejects the request", async () => {
    process.env.VERCEL_ANALYTICS_TOKEN = "tok";
    process.env.VERCEL_PROJECT_ID = "prj_1";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 403 })));
    expect(await getVercelTraffic()).toEqual({ status: "error", message: "Vercel API 403" });
  });
});
