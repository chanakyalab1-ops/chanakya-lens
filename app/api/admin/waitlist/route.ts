import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { isOwnerEmail } from "@/lib/memberAccess";
import { supabaseServer } from "@/lib/supabase-server";
import { toCsv } from "@/lib/csv";

// The waitlist as a CSV file. Owner only.
export async function GET() {
  const user = await getSessionUser();
  if (!user || !isOwnerEmail(user.email)) return new NextResponse("Not found", { status: 404 });
  const { data } = await supabaseServer().from("lens_plus_waitlist").select("email, source, created_at").order("created_at");
  const rows = [["Email", "Source", "Joined"], ...((data ?? []) as { email: string; source: string; created_at: string }[]).map((r) => [r.email, r.source, r.created_at.slice(0, 10)])];
  return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="lens-plus-waitlist.csv"', "Cache-Control": "private, no-store" } });
}
