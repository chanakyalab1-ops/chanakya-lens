import { createClient } from "@supabase/supabase-js";
import { describePlan, getBacklog, planGeneration, readBufferSettings } from "@/lib/pipelineBuffer";

export type RecentBatch = { id: number; anthropic_batch_id: string; status: string; created_at: string; processed_at: string | null };

export type Overview = {
  views24h: number;
  views30d: number;
  totalStories: number;
  digestSignups: number;
  feedbackCount: number;
  topStories: { path: string; headline: string | null; views: number }[];
  recentFeedback: { id: number; email: string | null; message: string; created_at: string }[];
  pipeline: {
    candidatesPending: number;
    candidatesBatchPending: number;
    batchesSubmitted: number;
    factChecking: number;
    inReview: number;
    published: number;
    rejected: number;
    factCheckFailed: number;
    recentBatches: RecentBatch[];
  };
  buffer: {
    settings: ReturnType<typeof readBufferSettings>;
    backlog: Awaited<ReturnType<typeof getBacklog>>;
    plan: ReturnType<typeof planGeneration>;
    message: string;
  };
};

export async function getOverview(): Promise<Overview> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const head = { count: "exact" as const, head: true };
  const day = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const month = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const draftsWith = (status: string) => supabase.from("story_drafts").select("*", head).eq("workflow_status", status);

  const [
    views24h, views30d, viewRows, totalStories, signups, feedbackCount, recentFeedback,
    candPending, candBatch, batchesSubmitted, recentBatches,
    factChecking, inReview, published, rejected, factCheckFailed,
    backlog,
  ] = await Promise.all([
    supabase.from("page_views").select("*", head).gte("created_at", day),
    supabase.from("page_views").select("*", head).gte("created_at", month),
    supabase.from("page_views").select("path").gte("created_at", month).limit(100000),
    supabase.from("stories").select("*", head),
    supabase.from("digest_signups").select("*", head),
    supabase.from("feedback_submissions").select("*", head),
    supabase.from("feedback_submissions").select("id, email, message, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("story_candidates").select("*", head).eq("status", "pending"),
    supabase.from("story_candidates").select("*", head).eq("status", "batch_pending"),
    supabase.from("generation_batches").select("*", head).eq("status", "submitted"),
    supabase.from("generation_batches").select("id, anthropic_batch_id, status, created_at, processed_at").order("id", { ascending: false }).limit(5),
    draftsWith("fact_checking"),
    draftsWith("in_review"),
    draftsWith("published"),
    draftsWith("rejected"),
    supabase.from("story_drafts").select("*", head).eq("fact_check_status", "failed"),
    getBacklog(supabase),
  ]);

  const counts = new Map<string, number>();
  for (const row of viewRows.data ?? []) counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Show headlines, not raw slugs.
  const slugs = top.map(([p]) => p.replace("/story/", "")).filter(Boolean);
  const { data: headlineRows } = slugs.length
    ? await supabase.from("stories").select("slug, headline").in("slug", slugs)
    : { data: [] as { slug: string; headline: string }[] };
  const headlineBySlug = new Map((headlineRows ?? []).map((r) => [r.slug, r.headline]));

  const settings = readBufferSettings();
  const plan = planGeneration(backlog, settings, settings.perRunMax);

  return {
    views24h: views24h.count ?? 0,
    views30d: views30d.count ?? 0,
    totalStories: totalStories.count ?? 0,
    digestSignups: signups.count ?? 0,
    feedbackCount: feedbackCount.count ?? 0,
    topStories: top.map(([path, views]) => ({ path, headline: headlineBySlug.get(path.replace("/story/", "")) ?? null, views })),
    recentFeedback: recentFeedback.data ?? [],
    pipeline: {
      candidatesPending: candPending.count ?? 0,
      candidatesBatchPending: candBatch.count ?? 0,
      batchesSubmitted: batchesSubmitted.count ?? 0,
      factChecking: factChecking.count ?? 0,
      inReview: inReview.count ?? 0,
      published: published.count ?? 0,
      rejected: rejected.count ?? 0,
      factCheckFailed: factCheckFailed.count ?? 0,
      recentBatches: recentBatches.data ?? [],
    },
    buffer: { settings, backlog, plan, message: describePlan(plan, backlog, settings) },
  };
}
