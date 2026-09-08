import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return new NextResponse("Missing email parameter.", { status: 400 });
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
    return new NextResponse(`Something went wrong: ${error.message}`, { status: 500 });
  }

  return new NextResponse(
    `<html><body style="font-family: -apple-system, sans-serif; text-align: center; padding: 60px 20px; background: #0A0D11; color: #C6D0E8;">
      <h1 style="color: white;">You've been unsubscribed</h1>
      <p>${email} will no longer receive the Chanakya Lens daily digest.</p>
      <a href="https://chanakyalens.com" style="color: #5FA8B5;">Back to chanakyalens.com</a>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
