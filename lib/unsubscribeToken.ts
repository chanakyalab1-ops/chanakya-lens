import { createHmac, timingSafeEqual } from "node:crypto";

// Unsubscribe links carry a token only we can make, so nobody can unsubscribe
// someone else's address just by knowing it. Uses UNSUBSCRIBE_SECRET, or
// CRON_SECRET when that is not set. With no secret, no token is valid.
const secret = () => process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || "";

export function unsubToken(email: string): string {
  const s = secret();
  if (!s) return "";
  return createHmac("sha256", s).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function verifyUnsubToken(email: string, token: string | null | undefined): boolean {
  const expected = unsubToken(email);
  if (!expected || !token || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
