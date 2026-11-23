// Membership is hidden from everyone but the site owner until it is switched on
// for the public. Same owner address as the admin pages (lib/supabase-middleware.ts).
const OWNER_EMAILS = ["chanakya.lab1@gmail.com"];

// Set MEMBERSHIP_PUBLIC=true in Vercel to open membership to all readers.
export function membershipVisibleTo(email: string | null | undefined, isPublic = process.env.MEMBERSHIP_PUBLIC === "true"): boolean {
  if (isPublic) return true;
  return !!email && OWNER_EMAILS.includes(email.toLowerCase());
}
