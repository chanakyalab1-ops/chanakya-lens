import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBatchStatus, getBatchResults } from "@/lib/anthropic-server";
import { slugify } from "@/lib/slug";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pendingBatches, error: batchesError } = await supabase
    .from("generation_batches")
    .select("id, anthropic_batch_id, candidate_groups")
    .eq("status", "submitted");

  if (batchesError) {
    return NextResponse.json({ error: batchesError.message }, { status: 500 });
  }

  if (!pendingBatches || pendingBatches.length === 0) {
    return NextResponse.json({ checked: 0, message: "No pending batches." });
  }

  let stillProcessing = 0;
  let completed = 0;
  let draftsCreated = 0;
  let draftsFailed = 0;
  const errors: string[] = [];

  for (const batch of pendingBatches) {
    try {
      const status = await getBatchStatus(batch.anthropic_batch_id);

      if (status !== "ended") {
        stillProcessing++;
        continue;
      }

      const results = await getBatchResults(batch.anthropic_batch_id);
      const groups: string[][] = batch.candidate_groups;

      for (const result of results) {
        const groupIndex = parseInt(result.customId.replace("group-", ""), 10);
        const candidateIds = groups[groupIndex];
        if (!candidateIds) continue;

        if (!result.draft) {
          draftsFailed++;
          errors.push(`${result.customId}: ${result.error}`);
          // Release these candidates back to pending so they can be retried.
          await supabase.from("story_candidates").update({ status: "pending" }).in("id", candidateIds);
          continue;
        }

        const generated = result.draft;
        const baseSlug = slugify(generated.headline);
        if (!baseSlug) {
          draftsFailed++;
          errors.push(`${result.customId}: empty headline`);
          await supabase.from("story_candidates").update({ status: "pending" }).in("id", candidateIds);
          continue;
        }

        let slug = baseSlug;
        for (let attempt = 0; attempt < 5; attempt++) {
          const [{ data: storyHit }, { data: draftHit }] = await Promise.all([
            supabase.from("stories").select("slug").eq("slug", slug).maybeSingle(),
            supabase.from("story_drafts").select("slug").eq("slug", slug).maybeSingle(),
          ]);
          if (!storyHit && !draftHit) break;
          slug = `${baseSlug}-${attempt + 2}`;
        }

        const { error: draftError } = await supabase.from("story_drafts").insert({
          slug,
          category: generated.category || null,
          status: generated.statusTag,
          headline: generated.headline.trim(),
          dek: generated.dek?.trim() || null,
          body: generated.body.trim(),
          read_time: generated.readTime?.trim() || "3 min",
          has_video: false,
          impact_nodes: generated.impactNodes ?? [],
          articles: candidateIds.map((id, i) => ({
            candidate_id: id,
            role: i === 0 ? "primary" : "source",
          })),
          chanakya_analysis: generated.chanakyaAnalysis,
          off_lens: generated.offLens,
          subject_countries: generated.subjectCountries ?? [],
          workflow_status: "in_review",
        });

        if (draftError) {
          draftsFailed++;
          errors.push(`${result.customId}: ${draftError.message}`);
          await supabase.from("story_candidates").update({ status: "pending" }).in("id", candidateIds);
          continue;
        }

        await supabase
          .from("story_candidates")
          .update({ status: "approved", story_slug: slug, reviewed_at: new Date().toISOString() })
          .in("id", candidateIds);

        draftsCreated++;
      }

      await supabase
        .from("generation_batches")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", batch.id);

      completed++;
    } catch (err) {
      errors.push(`Batch ${batch.anthropic_batch_id}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return NextResponse.json({ stillProcessing, completed, draftsCreated, draftsFailed, errors });
}
