// Membership is hidden from everyone but the site owner until it is switched on
// for the public. Same owner address as the admin pages (lib/supabase-middleware.ts).
const OWNER_EMAILS = ["chanakya.lab1@gmail.com"];

// Extra accounts allowed to see membership while it is private, for testing
// purchases from a second account. Comma-separated in MEMBERSHIP_TEST_EMAILS.
export function testEmails(raw: string | undefined = process.env.MEMBERSHIP_TEST_EMAILS): string[] {
  return (raw ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

// Set MEMBERSHIP_PUBLIC=true in Vercel to open membership to all readers.
export function membershipVisibleTo(
  email: string | null | undefined,
  isPublic = process.env.MEMBERSHIP_PUBLIC === "true",
  extra: string[] = testEmails()
): boolean {
  if (isPublic) return true;
  if (!email) return false;
  const e = email.toLowerCase();
  return OWNER_EMAILS.includes(e) || extra.includes(e);
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!email && OWNER_EMAILS.includes(email.toLowerCase());
}
