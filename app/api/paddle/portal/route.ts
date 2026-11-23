import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { createPortalLink } from "@/lib/paddle";
import { getMembership } from "@/lib/membership";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const m = await getMembership(user.id);
  if (!m) return NextResponse.json({ error: "No membership found." }, { status: 404 });

  try {
    return NextResponse.json({ url: await createPortalLink(m.providerCustomerId) });
  } catch (e) {
    console.error("paddle portal failed:", e);
    return NextResponse.json({ error: "Could not open billing." }, { status: 500 });
  }
}
