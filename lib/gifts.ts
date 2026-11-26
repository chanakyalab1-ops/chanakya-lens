import { randomBytes } from "node:crypto";

// Gift codes: a gift is a one-off payment that makes a code; whoever redeems the
// code gets Lens+ for a year with no card or renewal.
export const GIFT_MONTHS = 12;
// No 0/O, 1/I/L, so a code read out or typed from an email is hard to get wrong.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateGiftCode(bytes: (n: number) => Uint8Array = randomBytes): string {
  const raw = bytes(12);
  let out = "";
  for (let i = 0; i < 12; i++) out += ALPHABET[raw[i] % ALPHABET.length];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}

// "abcd efgh-jkmn" -> "ABCD-EFGH-JKMN"; null when it cannot be a gift code.
export function normalizeGiftCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length !== 12 || [...c].some((ch) => !ALPHABET.includes(ch))) return null;
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`;
}

// A gift adds to whatever time is left on an earlier gift instead of overlapping it.
export function giftPeriodEnd(now: Date, existingEnd: string | null | undefined, months = GIFT_MONTHS): Date {
  const start = existingEnd && new Date(existingEnd).getTime() > now.getTime() ? new Date(existingEnd) : now;
  const end = new Date(start.getTime());
  end.setUTCMonth(end.getUTCMonth() + months);
  return end;
}

export function giftEmailHtml(code: string): string {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
<div style="font:600 12px monospace;letter-spacing:.12em;text-transform:uppercase;color:#0E7080">Chanakya Lens</div>
<h1 style="font-size:26px;line-height:1.2;margin:10px 0 14px">Your Lens+ gift code</h1>
<p style="font-size:16px;line-height:1.6">Thank you for the gift. Here is the code. Send it to the person you are giving it to, or redeem it yourself.</p>
<p style="font:700 28px monospace;letter-spacing:.1em;background:#f1f5f7;padding:16px 18px;text-align:center">${code}</p>
<p style="font-size:16px;line-height:1.6">They go to <a href="https://chanakyalens.com/redeem">chanakyalens.com/redeem</a>, sign in, and enter the code. It gives one year of Lens+ with no card and no renewal, and each code works once.</p>
<p style="font:12px sans-serif;color:#888;margin-top:28px">Keep this email. Anyone who has the code can use it.</p></div>`;
}
