import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { selectImageForStory } from "@/lib/imageSelection";
import { sendAlert } from "@/lib/alerts";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: stories, error } = await supabase
    .from("stories")
    .select("slug, category, headline, body, subject_countries, sources")
    .is("image_url", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    await sendAlert("backfill-images", `Failed to query stories: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!stories || stories.length === 0) {
    return NextResponse.json({ updated: 0, message: "No stories missing images." });
  }

  let updated = 0;
  let failed = 0;
  let dbErrors = 0;

  for (const story of stories) {
    const sources = (story.sources ?? []) as { url: string; role: string }[];
    const primarySource = sources.find((s) => s.role === "primary");
    const image = await selectImageForStory(story.headline, story.body, story.category ?? "", story.subject_countries ?? undefined, primarySource?.url);

    if (image) {
      const { error: updateError } = await supabase
        .from("stories")
        .update({ image_url: image.imageUrl })
        .eq("slug", story.slug);

      if (updateError) {
        failed++;
        dbErrors++;
      } else {
        updated++;
      }
    } else {
      failed++; // no candidate cleared the quality bar -- expected, not an error
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Only alert on real errors, not the ordinary "no good image found" case
  // -- that's expected to happen for a meaningful share of stories.
  if (dbErrors > 0) {
    await sendAlert("backfill-images", `${dbErrors} database update(s) failed while writing image_url.`);
  } else if (failed === stories.length) {
    await sendAlert("backfill-images", `All ${stories.length} stories failed to get an image -- check PEXELS_API_KEY and upstream APIs.`);
  }

  return NextResponse.json({ updated, failed, total: stories.length });
}
