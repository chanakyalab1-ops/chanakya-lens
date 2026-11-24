import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUnsubToken } from "@/lib/unsubscribeToken";

// Unsubscribes an address. The link in every digest carries a token only we can
// make; without a valid one nothing is removed.
export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const token = req.nextUrl.searchParams.get("t");

  if (!email) {
    return NextResponse.json({ error: "Missing email parameter." }, { status: 400 });
  }
  if (!verifyUnsubToken(email, token)) {
    return NextResponse.json({ error: "This link is not valid. Ask for a new one." }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("digest_signups")
    .delete()
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
