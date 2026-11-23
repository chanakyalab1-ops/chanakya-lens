import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { getUserInterests } from "@/lib/userInterests";

// The homepage is cached for everyone, so the "For you" tab asks for the signed-in
// reader's interests here, in the browser, and filters the stories it already has.
export async function GET() {
  const user = await getSessionUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user) return NextResponse.json({ signedIn: false, interests: [] }, { headers });
  return NextResponse.json({ signedIn: true, interests: await getUserInterests(user.id) }, { headers });
}
