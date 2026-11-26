import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { isOwnerEmail } from "@/lib/memberAccess";
import { supabaseServer } from "@/lib/supabase-server";
import { toCsv } from "@/lib/csv";

// Group-plan requests as a CSV file. Owner only.
export async function GET() {
  const user = await getSessionUser();
  if (!user || !isOwnerEmail(user.email)) return new NextResponse("Not found", { status: 404 });
  const { data } = await supabaseServer().from("group_plan_requests").select("name, email, organisation, seats, note, created_at").order("created_at");
  const rows = [["Name", "Email", "Organisation", "People", "Note", "Asked"], ...((data ?? []) as Record<string, string>[]).map((r) => [r.name, r.email, r.organisation, r.seats, r.note, r.created_at.slice(0, 10)])];
  return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="group-plan-requests.csv"', "Cache-Control": "private, no-store" } });
}
