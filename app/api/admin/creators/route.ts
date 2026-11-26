import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { isOwnerEmail } from "@/lib/memberAccess";
import { supabaseServer } from "@/lib/supabase-server";
import { toCsv } from "@/lib/csv";

// Owner only. ?type=applications (default) or ?type=referrals (sign-ups per creator link).
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || !isOwnerEmail(user.email)) return new NextResponse("Not found", { status: 404 });
  const type = new URL(req.url).searchParams.get("type") === "referrals" ? "referrals" : "applications";
  const db = supabaseServer();
  let rows: string[][];
  if (type === "applications") {
    const { data } = await db.from("creator_applications").select("name, email, channel_url, audience, note, created_at").order("created_at");
    rows = [["Name", "Email", "Channel", "Audience", "Note", "Applied"], ...((data ?? []) as Record<string, string>[]).map((r) => [r.name, r.email, r.channel_url, r.audience, r.note, r.created_at.slice(0, 10)])];
  } else {
    const counts = new Map<string, { digest: number; waitlist: number }>();
    for (const [table, key] of [["digest_signups", "digest"], ["lens_plus_waitlist", "waitlist"]] as const) {
      const { data } = await db.from(table).select("ref").not("ref", "is", null).limit(50000);
      for (const r of (data ?? []) as { ref: string }[]) {
        const c = counts.get(r.ref) ?? { digest: 0, waitlist: 0 };
        c[key]++;
        counts.set(r.ref, c);
      }
    }
    rows = [["Creator link", "Digest sign-ups", "Waitlist sign-ups"], ...[...counts.entries()].sort((a, b) => b[1].digest + b[1].waitlist - (a[1].digest + a[1].waitlist)).map(([ref, c]) => [ref, String(c.digest), String(c.waitlist)])];
  }
  return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="creators-${type}.csv"`, "Cache-Control": "private, no-store" } });
}
