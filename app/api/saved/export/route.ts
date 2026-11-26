import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { paidAccess } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase-server";
import { getShelf } from "@/lib/userShelf";
import { toCsv } from "@/lib/csv";

// The signed-in reader's saved stories as a CSV file.
export async function GET() {
  const user = await getSessionUser();
  const access = await paidAccess(user);
  if (!user || access === "hidden") return new NextResponse("Not found", { status: 404 });
  if (access === "locked") return new NextResponse("CSV export is for Lens+ members.", { status: 403 });
  const saved = await getShelf(user.id);
  const { data } = saved.length ? await supabaseServer().from("stories").select("slug, headline, category").in("slug", saved.map((s) => s.slug)) : { data: [] };
  const by = new Map(((data ?? []) as { slug: string; headline: string; category: string }[]).map((s) => [s.slug, s]));
  const rows = [["Headline", "Category", "Link", "Saved on"]];
  for (const s of saved) {
    const st = by.get(s.slug);
    if (st) rows.push([st.headline, st.category, `https://chanakyalens.com/story/${s.slug}`, s.createdAt.slice(0, 10)]);
  }
  return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="saved-stories.csv"', "Cache-Control": "private, no-store" } });
}
