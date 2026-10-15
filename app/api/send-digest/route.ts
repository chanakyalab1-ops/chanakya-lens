import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAlert } from "@/lib/alerts";
import { brevoConfigured, resendConfigured, resendDailyLimit, sendEmail } from "@/lib/emailSend";
import { deliverDigest } from "@/lib/digestDelivery";
import { selectDigestForSubscriber } from "@/lib/digestStories";
import { buildDigestHtml } from "@/lib/digestHtml";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Skip if a digest already went out recently, to avoid duplicate sends
  // from manual re-triggers or accidental double-invocation.
  const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
  const { data: recentSend } = await supabase
    .from("digest_sends")
    .select("id")
    .gte("sent_at", twentyHoursAgo)
    .limit(1)
    .maybeSingle();

  if (recentSend) {
    return NextResponse.json({ skipped: true, reason: "Digest already sent within the last 20 hours" });
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select("slug, headline, dek, category, status, impact_nodes, image_url, sources, off_lens_countries")
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false });

  if (storiesError) {
    await sendAlert("send-digest", `Failed to load stories: ${storiesError.message}`);
    return NextResponse.json({ error: "Failed to load stories", details: storiesError.message }, { status: 500 });
  }
  if (!stories || stories.length === 0) {
    return NextResponse.json({ error: "No stories found for digest" }, { status: 500 });
  }

  const { data: subscribers, error: subsError } = await supabase
    .from("digest_signups")
    .select("email, regions");

  if (subsError) {
    await sendAlert("send-digest", `Failed to load subscribers: ${subsError.message}`);
    return NextResponse.json({ error: "Failed to load subscribers", details: subsError.message }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ sent: 0, message: "No subscribers yet" });
  }

  // Everyone gets the digest every day. Build each subscriber's email first
  // (their topics if there are matching stories, otherwise the top stories),
  // then hand the list to the delivery step, which splits it across Resend
  // and Brevo.
  const prepared: { to: string; subject: string; html: string }[] = [];
  let fellBackToTopStories = 0;

  for (const sub of subscribers) {
    // "regions" column stores chosen topics/categories.
    const digest = selectDigestForSubscriber(stories, sub.regions);
    if (!digest) continue;
    if (digest.fellBack) fellBackToTopStories++;
    prepared.push({
      to: sub.email,
      subject: `Today's Signal — Chanakya Lens`,
      html: buildDigestHtml(digest.stories, digest.topicLabel, sub.email, digest.fellBack),
    });
  }

  const summary = await deliverDigest(prepared, sendEmail, {
    resendLimit: resendDailyLimit(),
    hasBrevo: brevoConfigured(),
    hasResend: resendConfigured(),
  });

  await supabase.from("digest_sends").insert({});

  if (summary.failed > 0 || summary.notAttempted > 0 || summary.resend.stopped || summary.brevo.stopped) {
    const stopped = [
      summary.resend.stopped && `Resend stopped: ${summary.resend.stopped}`,
      summary.brevo.stopped && `Brevo stopped: ${summary.brevo.stopped}`,
    ].filter(Boolean);
    await sendAlert(
      "send-digest",
      `${summary.sent}/${prepared.length} sent (Resend ${summary.resend.sent}, Brevo ${summary.brevo.sent}), ${summary.failed} failed, ${summary.notAttempted} not attempted. ${stopped.join("; ")} ${summary.failures.slice(0, 20).join(", ")}`.trim(),
    );
  }

  return NextResponse.json({
    subscribers: subscribers.length,
    prepared: prepared.length,
    fellBackToTopStories,
    sent: summary.sent,
    failed: summary.failed,
    notAttempted: summary.notAttempted,
    resend: summary.resend,
    brevo: summary.brevo,
    failures: summary.failures,
  });
}
