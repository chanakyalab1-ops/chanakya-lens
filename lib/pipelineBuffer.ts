import type { SupabaseClient } from "@supabase/supabase-js";

// Generation is the expensive step (web search per story, then a fact-check
// call per draft), and drafts you never get round to reviewing are wasted
// spend. This caps how far ahead of your reviewing the pipeline may run.
//
// All three limits are env vars so they can be changed in Vercel without a
// deploy. The defaults are deliberately conservative.
export type BufferSettings = {
  // Max drafts waiting on you: fact-checking + in review + still generating.
  buffer: number;
  // Max new drafts in any rolling 24 hours, however fast you review.
  dailyCap: number;
  // Max stories one auto-generate run may start.
  perRunMax: number;
  // Hard stop: no automatic generation at all.
  paused: boolean;
};

function intFromEnv(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return raw !== undefined && raw !== "" && Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export function readBufferSettings(env: Record<string, string | undefined> = process.env): BufferSettings {
  return {
    buffer: intFromEnv(env.PIPELINE_BUFFER, 15),
    dailyCap: intFromEnv(env.PIPELINE_DAILY_CAP, 20),
    perRunMax: intFromEnv(env.PIPELINE_RUN_MAX, 10),
    paused: env.PIPELINE_PAUSED === "1" || env.PIPELINE_PAUSED === "true",
  };
}

export type Backlog = {
  factChecking: number;
  inReview: number;
  // Stories submitted to Anthropic whose batch hasn't been turned into drafts yet.
  inFlight: number;
  generated24h: number;
  generated7d: number;
};

export function unreviewed(b: Backlog): number {
  return b.factChecking + b.inReview + b.inFlight;
}

export async function getBacklog(supabase: SupabaseClient): Promise<Backlog> {
  const day = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [fc, ir, g24, g7, batches] = await Promise.all([
    supabase.from("story_drafts").select("*", { count: "exact", head: true }).eq("workflow_status", "fact_checking"),
    supabase.from("story_drafts").select("*", { count: "exact", head: true }).eq("workflow_status", "in_review"),
    supabase.from("story_drafts").select("*", { count: "exact", head: true }).gte("created_at", day),
    supabase.from("story_drafts").select("*", { count: "exact", head: true }).gte("created_at", week),
    supabase.from("generation_batches").select("candidate_groups").eq("status", "submitted"),
  ]);

  const inFlight = (batches.data ?? []).reduce(
    (sum, b: { candidate_groups: unknown }) => sum + (Array.isArray(b.candidate_groups) ? b.candidate_groups.length : 0),
    0,
  );

  return {
    factChecking: fc.count ?? 0,
    inReview: ir.count ?? 0,
    inFlight,
    generated24h: g24.count ?? 0,
    generated7d: g7.count ?? 0,
  };
}

export type GenerationPlan = {
  // How many stories this run may start (0 = skip the run).
  allow: number;
  // Which limit decided it, or null when the request fits in all of them.
  limitedBy: "paused" | "buffer" | "daily" | "run" | null;
  // Stories that could still start before the buffer or the daily cap bites.
  room: number;
};

export function planGeneration(backlog: Backlog, settings: BufferSettings, requested: number): GenerationPlan {
  const bufferRoom = Math.max(0, settings.buffer - unreviewed(backlog));
  const dailyRoom = Math.max(0, settings.dailyCap - backlog.generated24h);
  const room = Math.min(bufferRoom, dailyRoom);

  if (settings.paused) return { allow: 0, limitedBy: "paused", room };
  if (bufferRoom === 0) return { allow: 0, limitedBy: "buffer", room };
  if (dailyRoom === 0) return { allow: 0, limitedBy: "daily", room };

  const allow = Math.min(requested, settings.perRunMax, room);
  let limitedBy: GenerationPlan["limitedBy"] = null;
  if (allow < requested) {
    limitedBy = allow === room ? (bufferRoom <= dailyRoom ? "buffer" : "daily") : "run";
  }
  return { allow, limitedBy, room };
}

export function describePlan(plan: GenerationPlan, backlog: Backlog, settings: BufferSettings): string {
  if (plan.allow === 0) {
    switch (plan.limitedBy) {
      case "paused":
        return "Automatic generation is paused (PIPELINE_PAUSED).";
      case "daily":
        return `Daily cap reached: ${backlog.generated24h} of ${settings.dailyCap} drafts generated in the last 24 hours.`;
      default:
        return `Buffer full: ${unreviewed(backlog)} of ${settings.buffer} drafts are waiting on review. Review some to reopen generation.`;
    }
  }
  const room = `room for ${plan.room} more draft${plan.room === 1 ? "" : "s"}`;
  if (plan.limitedBy === "buffer") return `Open, but the buffer is nearly full: ${room}.`;
  if (plan.limitedBy === "daily") return `Open, but the daily cap is nearly reached: ${room}.`;
  return `Open: ${room}.`;
}
