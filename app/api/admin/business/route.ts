import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { isOwnerEmail } from "@/lib/memberAccess";
import { supabaseServer } from "@/lib/supabase-server";
import { toCsv } from "@/lib/csv";

// The business pilot list as a CSV file. Owner only.
export async function GET() {
  const user = await getSessionUser();
  if (!user || !isOwnerEmail(user.email)) return new NextResponse("Not found", { status: 404 });
  const { data } = await supabaseServer().from("business_waitlist").select("name, email, company, role, interests, created_at").order("created_at");
  const rows = [["Name", "Email", "Company", "Role", "Routes or countries", "Joined"], ...((data ?? []) as Record<string, string>[]).map((r) => [r.name, r.email, r.company, r.role, r.interests, r.created_at.slice(0, 10)])];
  return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="business-pilot-list.csv"', "Cache-Control": "private, no-store" } });
}
