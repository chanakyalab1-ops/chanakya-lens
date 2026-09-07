import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { inferStoryRegion } from "@/lib/regions";

type DigestStory = {
  slug: string;
  headline: string;
  dek: string;
  category: string;
  status: string | null;
  impact_nodes: { confidence: string }[] | null;
  subject_countries: string[] | null;
  sources: { source_country: string | null }[] | null;
};

function rank(s: DigestStory): number {
  const hasDirect = s.impact_nodes?.some((n) => n.confidence === "direct");
  const isDeveloping = s.status === "developing";
  let score = 0;
  if (isDeveloping) score += 2;
  if (hasDirect) score += 1;
  return score;
}

function pickDigestStories(stories: DigestStory[], limit: number): DigestStory[] {
  return [...stories].sort((a, b) => rank(b) - rank(a)).slice(0, limit);
}

function buildDigestHtml(stories: DigestStory[], regionLabel: string): string {
  const items = stories
    .map(
      (s) => `
      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #2A3D74;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #7688B4; margin-bottom: 6px;">
          ${s.category}
        </div>
        <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #0A0D11;">
          <a href="https://chanakyalens.com/story/${s.slug}" style="color: #0A0D11; text-decoration: none;">
            ${s.headline}
          </a>
        </h2>
        <p style="font-size: 14px; color: #444; margin: 0;">${s.dek}</p>
      </div>
    `
    )
    .join("");

  return `
    <div style="max-width: 560px; margin: 0 auto; font-family: -apple-system, sans-serif; padding: 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <img src="https://chanakyalens.com/logo-mark.png" alt="" width="32" height="32" style="border-radius: 50%;" />
          <span style="font-weight: 800; font-size: 18px; letter-spacing: 0.02em; color: #0A0D11;">CHANAKYA <span style="color: #5FA8B5;">LENS</span></span>
        </div>
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #7688B4;">This Week's Signal — ${regionLabel}</div>
        <h1 style="font-size: 22px; margin: 8px 0 0 0;">Global moves. Local math.</h1>
      </div>
      ${items}
      <div style="text-align: center; margin-top: 32px;">
        <a href="https://chanakyalens.com" style="color: #5FA8B5; font-size: 13px;">Read more at chanakyalens.com →</a>
      </div>
    </div>
  `;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select("slug, headline, dek, category, status, impact_nodes, subject_countries, sources")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false });

  if (storiesError || !stories || stories.length === 0) {
    return NextResponse.json({ error: "No stories found for digest", details: storiesError?.message }, { status: 500 });
  }

  // Precompute each story's region using the same logic as /regions.
  const storiesWithRegion = stories.map((s) => ({
    ...s,
    region: inferStoryRegion({
      subjectCountries: s.subject_countries ?? undefined,
      sources: (s.sources ?? []).map((src) => ({
        sourceCountry: src.source_country,
        url: "",
        title: "",
        domain: "",
        role: "source" as const,
      })),
    } as never),
  }));

  const { data: subscribers, error: subsError } = await supabase
    .from("digest_signups")
    .select("email, regions");

  if (subsError) {
    return NextResponse.json({ error: "Failed to load subscribers", details: subsError.message }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ sent: 0, message: "No subscribers yet" });
  }

  let sent = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const sub of subscribers) {
    const subRegions: string[] = sub.regions ?? [];
    const hasPreference = subRegions.length > 0;

    const relevantStories = hasPreference
      ? storiesWithRegion.filter((s) => subRegions.includes(s.region))
      : storiesWithRegion;

    if (relevantStories.length === 0) {
      // No matching stories this week for their chosen regions -- skip rather than send an empty email.
      continue;
    }

    const digestStories = pickDigestStories(relevantStories, 6);
    const regionLabel = hasPreference ? subRegions.join(", ") : "All Regions";
    const html = buildDigestHtml(digestStories, regionLabel);

    try {
      const result = await resend.emails.send({
        from: "Chanakya Lens <onboarding@resend.dev>",
        to: sub.email,
        subject: `This Week's Signal — Chanakya Lens`,
        html,
      });
      console.log(`[Digest] Sent to ${sub.email}:`, JSON.stringify(result));
      if (result.error) {
        throw new Error(result.error.message);
      }
      sent++;
    } catch (err) {
      failed++;
      failures.push(sub.email);
      console.error(`Failed to send to ${sub.email}:`, err);
    }
  }

  return NextResponse.json({ sent, failed, failures });
}
