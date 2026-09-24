import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBatchStatus, getBatchResults } from "@/lib/anthropic-server";
import { slugify } from "@/lib/slug";
import { sendAlert } from "@/lib/alerts";

export const maxDuration = 300;

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
  const draftIdsToFactCheck: string[] = [];

  for (const batch of pendingBatches) {
    try {
      const status = await getBatchStatus(batch.anthropic_batch_id);

      if (status !== "ended") {
        stillProcessing++;
        continue;
      }

      const results = await getBatchResults(batch.anthropic_batch_id);
      const groups: string[][] = batch.candidate_groups;
      const handledGroupIndexes = new Set<number>();

      for (const result of results) {
        const groupIndex = parseInt(result.customId.replace("group-", ""), 10);
        const candidateIds = groups[groupIndex];
        if (!candidateIds) continue;
        handledGroupIndexes.add(groupIndex);

        if (!result.draft) {
          draftsFailed++;
          errors.push(`${result.customId}: ${result.error}`);
          // Rejected, not pending -- otherwise a permanently-failing group
          // (e.g. content the model refuses) gets resubmitted every cycle
          // forever instead of ever leaving the queue.
          await supabase.from("story_candidates").update({ status: "rejected" }).in("id", candidateIds);
          continue;
        }

        const generated = result.draft;
        const baseSlug = slugify(generated.headline);
        if (!baseSlug) {
          draftsFailed++;
          errors.push(`${result.customId}: empty headline`);
          await supabase.from("story_candidates").update({ status: "rejected" }).in("id", candidateIds);
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

        const { data: newDraft, error: draftError } = await supabase.from("story_drafts").insert({
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
          // Held out of the review queue until fact-check completes (see
          // /api/fact-check, which flips this to "in_review").
          workflow_status: "fact_checking",
        }).select("id").single();

        if (draftError) {
          draftsFailed++;
          errors.push(`${result.customId}: ${draftError.message}`);
          await supabase.from("story_candidates").update({ status: "rejected" }).in("id", candidateIds);
          continue;
        }

        await supabase
          .from("story_candidates")
          .update({ status: "approved", story_slug: slug, reviewed_at: new Date().toISOString() })
          .in("id", candidateIds);

        draftsCreated++;

        if (newDraft?.id) {
          draftIdsToFactCheck.push(newDraft.id);
        }
      }

      // Anthropic's batch response can omit a customId entirely (not even a
      // "failed" result) -- those groups never went through the loop above
      // and would otherwise sit at "pending" forever with no record of why.
      for (let i = 0; i < groups.length; i++) {
        if (handledGroupIndexes.has(i)) continue;
        const candidateIds = groups[i];
        if (!candidateIds || candidateIds.length === 0) continue;
        draftsFailed++;
        errors.push(`group-${i}: no result returned by Anthropic for this batch`);
        await supabase.from("story_candidates").update({ status: "rejected" }).in("id", candidateIds);
      }

      // Verification: nothing this batch touched should still be pending
      // once it's marked processed. If something is, a code path above
      // missed it -- force it out of the loop rather than let it silently
      // recur in every future batch.
      const allCandidateIds = groups.flat();
      if (allCandidateIds.length > 0) {
        const { data: stillPending } = await supabase
          .from("story_candidates")
          .select("id")
          .in("id", allCandidateIds)
          .eq("status", "pending");
        if (stillPending && stillPending.length > 0) {
          const stuckIds = stillPending.map((c) => c.id);
          errors.push(`Batch ${batch.anthropic_batch_id}: ${stuckIds.length} candidate(s) still pending after processing, forced to rejected: ${stuckIds.join(", ")}`);
          await supabase.from("story_candidates").update({ status: "rejected" }).in("id", stuckIds);
        }
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

  if (draftIdsToFactCheck.length > 0) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chanakyalens.com";
    // Vercel freezes the function runtime as soon as the response above is sent,
    // which kills any unawaited fetch before it reaches the fact-check endpoint.
    // after() keeps the runtime alive until these requests actually complete.
    after(async () => {
      await Promise.allSettled(
        draftIdsToFactCheck.map((draft_id) =>
          fetch(`${baseUrl}/api/fact-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draft_id }),
          })
        )
      );
    });
  }

  if (errors.length > 0) {
    await sendAlert("check-batches", `${errors.length} error(s): ${errors.join("; ")}`);
  }

  return NextResponse.json({ stillProcessing, completed, draftsCreated, draftsFailed, errors });
}