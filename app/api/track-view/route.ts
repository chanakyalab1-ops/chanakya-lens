import { NextRequest, NextResponse } from "next/server";
import { logPageView } from "@/lib/analytics";

// Logging page views from inside the story page's Server Component doesn't
// work: that page is statically cached (revalidate=300), so the component
// body -- and therefore any view-logging call in it -- only re-runs once
// every 5 minutes per story, not on every actual visit. This route is hit
// from a client-side beacon instead, so it fires on every real page load
// regardless of the page's own caching.
export async function POST(req: NextRequest) {
  const { path } = await req.json();
  if (typeof path !== "string" || !path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }
  await logPageView(path);
  return NextResponse.json({ success: true });
}
