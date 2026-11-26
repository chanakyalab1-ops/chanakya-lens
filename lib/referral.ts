// Creator referral links: chanakyalens.com/?ref=name. The name is remembered in a
// cookie for 30 days (first link wins) and saved with the digest sign-up.
export const REF_COOKIE = "cl_ref";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function sanitizeRef(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{1,39}$/.test(v) ? v : null;
}

export function readRefCookie(cookieString: string): string | null {
  const m = cookieString.match(new RegExp(`(?:^|;\\s*)${REF_COOKIE}=([^;]*)`));
  return m ? sanitizeRef(decodeURIComponent(m[1])) : null;
}

// Browser only. Keeps an existing ref (first touch), otherwise stores one from the URL.
export function captureRefFromUrl(): void {
  if (readRefCookie(document.cookie)) return;
  const ref = sanitizeRef(new URLSearchParams(window.location.search).get("ref"));
  if (ref) document.cookie = `${REF_COOKIE}=${encodeURIComponent(ref)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

type InsertResult = { error: { code?: string; message?: string } | null };
type SignupClient = { from: (t: string) => { insert: (row: Record<string, unknown>) => PromiseLike<InsertResult> } };

// Saves a digest sign-up with the referral name when there is one. If the `ref`
// column has not been added yet, the sign-up is saved without it, so a missing
// column never costs a subscriber.
export async function insertDigestSignup(client: SignupClient, row: { email: string; regions: string[] }, ref: string | null): Promise<InsertResult> {
  if (ref) {
    const res = await client.from("digest_signups").insert({ ...row, ref });
    const missingColumn = res.error && (res.error.code === "PGRST204" || res.error.code === "42703" || /\bref\b/.test(res.error.message ?? ""));
    if (!missingColumn) return res;
  }
  return client.from("digest_signups").insert(row);
}
