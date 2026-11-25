import { isOwnerEmail } from "./memberAccess";
import { getMembership, isActiveMember } from "./membership";

// Lens+ only: the tools that cost money or carry the most value. Everything
// else (Save, My Lens, Focus filters, offline reading, 3 Watchlist items) is free
// for any signed-in reader once membership is public.
export const PAID_FEATURES = {
  ask: { name: "Ask the Lens", blurb: "Free readers can ask 1 question a day. Lens+ members get 5, with sources every time." },
  compare: { name: "Compare", blurb: "Pick two countries, places or actors and see what they share and where they differ." },
  reading: { name: "Reading Map", blurb: "See what you read, your reading streak, and which countries you keep missing." },
  export: { name: "CSV export", blurb: "Download your saved stories as a spreadsheet." },
  watch: { name: "Watch a story", blurb: "Get an alert when one specific story is updated." },
  emailMe: { name: "Email me", blurb: "Send any story to your inbox as a clean, readable email." },
} as const;
export type PaidFeature = keyof typeof PAID_FEATURES;

// "hidden": not open to the public yet and not the owner. "locked": open, but
// Lens+ only and this reader is not a member. "allowed": use it.
export type Access = "allowed" | "locked" | "hidden";

export function paidAccessFor(opts: { email: string | null | undefined; isMember: boolean; membershipPublic: boolean }): Access {
  if (isOwnerEmail(opts.email)) return "allowed";
  if (!opts.membershipPublic) return "hidden";
  return opts.isMember ? "allowed" : "locked";
}

// Server side: what this signed-in user may do with the paid tools.
export async function paidAccess(user: { id: string; email?: string | null } | null): Promise<Access> {
  if (!user) return "hidden";
  const membershipPublic = process.env.MEMBERSHIP_PUBLIC === "true";
  if (isOwnerEmail(user.email) || !membershipPublic) return paidAccessFor({ email: user.email, isMember: false, membershipPublic });
  return paidAccessFor({ email: user.email, isMember: isActiveMember(await getMembership(user.id)), membershipPublic });
}
