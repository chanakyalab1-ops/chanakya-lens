import { cleanEmail } from "./waitlist";

export const BUSINESS_ROLES = ["Exporter", "Importer", "Freight forwarder or logistics", "Manufacturer", "Trader", "Consultant or analyst", "Other"] as const;

export type BusinessSignup = { name: string; email: string; company: string; role: string; interests: string };

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

// Checks a business waitlist sign-up from the browser; returns clean fields or null.
export function validateBusinessSignup(raw: unknown): BusinessSignup | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = clip(r.name, 80);
  const company = clip(r.company, 100);
  const email = cleanEmail(r.email);
  const role = (BUSINESS_ROLES as readonly string[]).includes(clip(r.role, 60)) ? clip(r.role, 60) : "";
  if (!name || !company || !email) return null;
  return { name, email, company, role, interests: clip(r.interests, 400) };
}

export function businessEmailHtml(name: string): string {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
<div style="font:600 12px monospace;letter-spacing:.12em;text-transform:uppercase;color:#0E7080">Chanakya Lens+ for Business</div>
<h1 style="font-size:26px;line-height:1.2;margin:10px 0 14px">You are on the pilot list</h1>
<p style="font-size:16px;line-height:1.6">Hi ${name.replace(/[<>&"]/g, "")}, thank you. We are building shipping and trade-risk briefings for businesses. We will send you a free sample brief first, and ask what would make it useful for you.</p>
<p style="font:12px sans-serif;color:#888;margin-top:28px">You signed up at chanakyalens.com/business. If this was not you, ignore this email and you will not hear from us again.</p></div>`;
}
