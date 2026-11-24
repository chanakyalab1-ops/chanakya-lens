import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { pushConfigured } from "@/lib/push";
import { validatePrefs } from "@/lib/pushMatch";
import { getSessionUser } from "@/lib/supabase-user";

type Body = { subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }; prefs?: unknown };

// Saves (or updates) a browser's notification subscription and what it wants.
export async function POST(req: Request) {
  if (!pushConfigured()) return NextResponse.json({ error: "Notifications are not open yet." }, { status: 503 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const endpoint = body.subscription?.endpoint;
  const p256dh = body.subscription?.keys?.p256dh;
  const auth = body.subscription?.keys?.auth;
  const prefs = validatePrefs(body.prefs);
  if (typeof endpoint !== "string" || !/^https:\/\//.test(endpoint) || endpoint.length > 1000 || typeof p256dh !== "string" || typeof auth !== "string" || !prefs) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  // Link the browser to the signed-in reader (if any) so single-story watches can reach it.
  const user = await getSessionUser().catch(() => null);
  const { error } = await supabaseServer()
    .from("push_subscriptions")
    .upsert(
      { ...(user ? { user_id: user.id } : {}), endpoint, p256dh, auth, topics: prefs.topics, breaking_only: prefs.breakingOnly, user_agent: (req.headers.get("user-agent") ?? "").slice(0, 200), updated_at: new Date().toISOString() },
      { onConflict: "endpoint" }
    );
  if (error) {
    console.error("push subscribe failed:", error.message);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
