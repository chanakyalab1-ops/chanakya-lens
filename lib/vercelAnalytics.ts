// Reads Vercel Web Analytics through the public REST API:
// https://vercel.com/docs/analytics/web-analytics-api
//
// Needs VERCEL_ANALYTICS_TOKEN (a Vercel access token) and VERCEL_PROJECT_ID.
// VERCEL_TEAM_ID is only needed when the project belongs to a team. Without
// the token or project id the admin panel says so instead of failing.

const API = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate";
const DAY_MS = 24 * 60 * 60 * 1000;

export type Totals = { pageviews: number; visitors: number };
export type Referrer = { host: string; pageviews: number; visitors: number };

export type VercelTraffic =
  | { status: "ok"; day: Totals; month: Totals; referrers: Referrer[] }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

type Row = Record<string, unknown>;

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function sumRows(rows: Row[]): Totals {
  return rows.reduce<Totals>(
    (t, r) => ({ pageviews: t.pageviews + num(r.pageviews), visitors: t.visitors + num(r.visitors) }),
    { pageviews: 0, visitors: 0 },
  );
}

export function toReferrers(rows: Row[]): Referrer[] {
  return rows
    .map((r) => ({
      host: typeof r.referrerHostname === "string" && r.referrerHostname ? r.referrerHostname : "Direct / unknown",
      pageviews: num(r.pageviews),
      visitors: num(r.visitors),
    }))
    .sort((a, b) => b.pageviews - a.pageviews);
}

async function query(by: string, since: number, until: number, extra: Record<string, string> = {}): Promise<Row[]> {
  const params = new URLSearchParams({
    projectId: process.env.VERCEL_PROJECT_ID!,
    by,
    since: String(since),
    until: String(until),
    ...extra,
  });
  if (process.env.VERCEL_TEAM_ID) params.set("teamId", process.env.VERCEL_TEAM_ID);
  const res = await fetch(`${API}?${params}`, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_ANALYTICS_TOKEN}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Vercel API ${res.status}`);
  const body = (await res.json()) as { data?: unknown };
  return Array.isArray(body.data) ? (body.data as Row[]) : [];
}

export async function getVercelTraffic(now = Date.now()): Promise<VercelTraffic> {
  if (!process.env.VERCEL_ANALYTICS_TOKEN || !process.env.VERCEL_PROJECT_ID) return { status: "unconfigured" };
  try {
    // Grouping by environment collapses the range into one row of totals;
    // the default filter is production only.
    const [day, month, refs] = await Promise.all([
      query("environment", now - DAY_MS, now),
      query("environment", now - 30 * DAY_MS, now),
      query("referrerHostname", now - 30 * DAY_MS, now, { limit: "6" }),
    ]);
    return { status: "ok", day: sumRows(day), month: sumRows(month), referrers: toReferrers(refs) };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "request failed" };
  }
}
