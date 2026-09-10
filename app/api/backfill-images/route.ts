import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchImageForCategory } from "@/lib/pexels";
import { fetchImageForEntity } from "@/lib/wikimedia";

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
    .select("slug, category, headline, body")
    .is("image_url", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!stories || stories.length === 0) {
    return NextResponse.json({ updated: 0, message: "No stories missing images." });
  }

  let updated = 0;
  let failed = 0;
  let fromWikimedia = 0;
  let fromPexels = 0;

  for (const story of stories) {
    const entityImage = await fetchImageForEntity(story.headline, story.body);
    const image = entityImage ?? (await fetchImageForCategory(story.category ?? ""));

    if (image) {
      const { error: updateError } = await supabase
        .from("stories")
        .update({ image_url: image.imageUrl })
        .eq("slug", story.slug);

      if (updateError) {
        failed++;
      } else {
        updated++;
        if (entityImage) fromWikimedia++;
        else fromPexels++;
      }
    } else {
      failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return NextResponse.json({ updated, failed, fromWikimedia, fromPexels, total: stories.length });
}
