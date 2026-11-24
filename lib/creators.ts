import { cleanEmail } from "./waitlist";

export type CreatorApplication = { name: string; email: string; channelUrl: string; audience: string; note: string };

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

function cleanUrl(raw: unknown): string | null {
  const v = clip(raw, 300);
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

// Checks a creator application from the browser; returns clean fields or null.
export function validateApplication(raw: unknown): CreatorApplication | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = clip(r.name, 80);
  const email = cleanEmail(r.email);
  const channelUrl = cleanUrl(r.channelUrl);
  if (!name || !email || !channelUrl) return null;
  return { name, email, channelUrl, audience: clip(r.audience, 40), note: clip(r.note, 600) };
}
