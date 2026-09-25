import Link from "next/link";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { MARKET_SYMBOLS, fetchQuote, getMarketRows, type MarketDataRow, type QuoteResult } from "@/lib/marketData";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Live-checks each ticker symbol against Twelve Data right now, so the real
// reason a symbol isn't showing (bad plan tier, wrong symbol, missing key)
// is visible on the page itself instead of requiring log/DB access to
// diagnose. Sequential with a small gap between calls -- firing all 5 at
// once (as this originally did) tripped Twelve Data's rate limit itself and
// produced misleading 429s that had nothing to do with the real, underlying
// per-symbol issue. Runs on every /admin load (dynamic, no caching) -- fine
// at this traffic level, and it's the same call the cron makes, just not
// batched the way the diagnostic view was.
async function getMarketDiagnostics() {
  const rows = await getMarketRows();
  const rowBySymbol = new Map(rows.map((r) => [r.symbol, r]));

  const checks: { symbol: string; label: string; cached: MarketDataRow | null; live: QuoteResult }[] = [];
  for (const s of MARKET_SYMBOLS) {
    const result = await fetchQuote(s.symbol);
    checks.push({ symbol: s.symbol, label: s.label, cached: rowBySymbol.get(s.symbol) ?? null, live: result });
    await sleep(500);
  }
  return checks;
}

async function getAnalyticsSummary() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { count: views24h } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { count: views30d } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo);

  const { data: views30dRows } = await supabase
    .from("page_views")
    .select("path")
    .gte("created_at", thirtyDaysAgo)
    .limit(100000);

  const { count: totalStories } = await supabase
    .from("stories")
    .select("*", { count: "exact", head: true });
  const { count: pendingCandidates } = await supabase
    .from("story_candidates")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  const { count: draftsInReview } = await supabase
    .from("story_drafts")
    .select("*", { count: "exact", head: true })
    .eq("workflow_status", "in_review");

  // Pipeline health: every status a candidate/batch/draft can sit in along
  // the ingest -> auto-generate -> check-batches -> fact-check -> review
  // path, so a stuck stage (e.g. drafts piling up at "fact_checking" because
  // the fact-check callback never fired) is visible without querying the
  // database by hand.
  const [
    { count: candidatesPending },
    { count: candidatesBatchPending },
    { count: batchesSubmitted },
    { data: recentBatches },
    { count: draftsFactChecking },
    { count: draftsPublished },
    { count: draftsRejected },
    { count: factCheckFailed },
  ] = await Promise.all([
    supabase.from("story_candidates").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("story_candidates").select("*", { count: "exact", head: true }).eq("status", "batch_pending"),
    supabase.from("generation_batches").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase
      .from("generation_batches")
      .select("id, anthropic_batch_id, status, created_at, processed_at")
      .order("id", { ascending: false })
      .limit(5),
    supabase.from("story_drafts").select("*", { count: "exact", head: true }).eq("workflow_status", "fact_checking"),
    supabase.from("story_drafts").select("*", { count: "exact", head: true }).eq("workflow_status", "published"),
    supabase.from("story_drafts").select("*", { count: "exact", head: true }).eq("workflow_status", "rejected"),
    supabase.from("story_drafts").select("*", { count: "exact", head: true }).eq("fact_check_status", "failed"),
  ]);

  const { count: totalFeedback } = await supabase
    .from("feedback_submissions")
    .select("*", { count: "exact", head: true });
  const { count: totalDigestSignups } = await supabase
    .from("digest_signups")
    .select("*", { count: "exact", head: true });
  const { data: recentFeedback } = await supabase
    .from("feedback_submissions")
    .select("id, email, message, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const viewCounts = new Map<string, number>();
  for (const row of views30dRows ?? []) {
    viewCounts.set(row.path, (viewCounts.get(row.path) ?? 0) + 1);
  }
  const topStories = [...viewCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }));

  return {
    views24h: views24h ?? 0,
    views30d: views30d ?? 0,
    topStories,
    totalStories: totalStories ?? 0,
    pendingCandidates: pendingCandidates ?? 0,
    draftsInReview: draftsInReview ?? 0,
    totalFeedback: totalFeedback ?? 0,
    totalDigestSignups: totalDigestSignups ?? 0,
    recentFeedback: recentFeedback ?? [],
    pipeline: {
      candidatesPending: candidatesPending ?? 0,
      candidatesBatchPending: candidatesBatchPending ?? 0,
      batchesSubmitted: batchesSubmitted ?? 0,
      recentBatches: recentBatches ?? [],
      draftsFactChecking: draftsFactChecking ?? 0,
      draftsPublished: draftsPublished ?? 0,
      draftsRejected: draftsRejected ?? 0,
      factCheckFailed: factCheckFailed ?? 0,
    },
  };
}

export default async function AdminPage() {
  const [stats, marketDiagnostics] = await Promise.all([getAnalyticsSummary(), getMarketDiagnostics()]);
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl font-bold mb-8" style={{ color: "var(--text-on-ink)" }}>
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-10">
        <StatCard label="Views (24h)" value={stats.views24h} />
        <StatCard label="Views (30d)" value={stats.views30d} />
        <StatCard label="Published Stories" value={stats.totalStories} />
        <StatCard label="Pending Candidates" value={stats.pendingCandidates} />
        <StatCard label="Drafts in Review" value={stats.draftsInReview} />
        <StatCard label="Feedback" value={stats.totalFeedback} />
        <StatCard label="Digest Signups" value={stats.totalDigestSignups} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <AdminLink href="/review" title="Review Queue" description="Generate and review story drafts from candidates." />
        <AdminLink href="/review/manage" title="Manage Published Stories" description="Edit or unpublish live stories." />
      </div>

      <h2 className="font-display text-lg font-bold mb-4" style={{ color: "var(--text-on-ink)" }}>
        Pipeline Health
      </h2>
      <p className="text-[0.8rem] mb-4" style={{ color: "var(--text-on-ink-dim)" }}>
        Candidate (ingest) → batch (auto-generate) → draft (check-batches) → fact-check → review. A stage stuck
        above zero for a while (especially &quot;Drafts awaiting fact-check&quot;) usually means the next stage
        isn&apos;t firing.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Candidates Pending" value={stats.pipeline.candidatesPending} />
        <StatCard label="Candidates in Batch" value={stats.pipeline.candidatesBatchPending} />
        <StatCard label="Batches Submitted" value={stats.pipeline.batchesSubmitted} />
        <StatCard label="Drafts Awaiting Fact-Check" value={stats.pipeline.draftsFactChecking} />
        <StatCard label="Fact-Check Failed" value={stats.pipeline.factCheckFailed} />
        <StatCard label="Drafts Published" value={stats.pipeline.draftsPublished} />
        <StatCard label="Drafts Rejected" value={stats.pipeline.draftsRejected} />
      </div>
      {stats.pipeline.recentBatches.length > 0 && (
        <div className="flex flex-col gap-2 mb-10">
          <div className="font-mono text-[0.62rem] uppercase tracking-wide mb-1" style={{ color: "var(--text-on-ink-dim)" }}>
            Recent Generation Batches
          </div>
          {stats.pipeline.recentBatches.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-sm border p-3"
              style={{ background: "var(--ink-card)", borderColor: "var(--border)" }}
            >
              <span className="font-mono text-[0.7rem] truncate" style={{ color: "var(--text-body)" }}>
                {b.anthropic_batch_id}
              </span>
              <span
                className="font-mono text-[0.68rem] shrink-0"
                style={{ color: b.status === "submitted" ? "var(--developing)" : "var(--brand-soft)" }}
              >
                {b.status}
              </span>
              <span className="font-mono text-[0.6rem] shrink-0" style={{ color: "var(--text-on-ink-dim)" }}>
                {new Date(b.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display text-lg font-bold mb-4" style={{ color: "var(--text-on-ink)" }}>
        Market Ticker
      </h2>
      <p className="text-[0.8rem] mb-4" style={{ color: "var(--text-on-ink-dim)" }}>
        &quot;Live check&quot; calls Twelve Data right now, on this page load -- if a symbol shows an error here,
        that&apos;s the exact reason it isn&apos;t appearing in the homepage ticker.
      </p>
      <div className="flex flex-col gap-2 mb-10">
        {marketDiagnostics.map((m) => (
          <div
            key={m.symbol}
            className="flex items-center justify-between gap-3 rounded-sm border p-3 flex-wrap"
            style={{ background: "var(--ink-card)", borderColor: "var(--border)" }}
          >
            <span className="font-mono text-[0.75rem] shrink-0" style={{ color: "var(--brand-soft)" }}>
              {m.label} <span style={{ color: "var(--text-on-ink-dim)" }}>({m.symbol})</span>
            </span>
            <span className="font-mono text-[0.68rem]" style={{ color: "var(--text-on-ink-dim)" }}>
              cached: {m.cached ? `${m.cached.price} @ ${new Date(m.cached.updated_at).toLocaleString()}` : "no row yet"}
            </span>
            <span
              className="font-mono text-[0.68rem]"
              style={{ color: m.live.ok ? "var(--possible)" : "var(--developing)" }}
            >
              {m.live.ok ? `✓ live: ${m.live.quote.price}` : `✗ ${m.live.reason}`}
            </span>
          </div>
        ))}
      </div>

      <h2 className="font-display text-lg font-bold mb-4" style={{ color: "var(--text-on-ink)" }}>
        Top Stories (30 days)
      </h2>
      {stats.topStories.length === 0 ? (
        <p className="text-[0.85rem] mb-10" style={{ color: "var(--text-on-ink-dim)" }}>
          No views yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2 mb-10">
          {stats.topStories.map((s, i) => (
            <Link
              key={s.path}
              href={s.path}
              className="flex items-center justify-between gap-3 rounded-sm border p-3 hover:opacity-80"
              style={{ background: "var(--ink-card)", borderColor: "var(--border)" }}
            >
              <span className="text-[0.85rem] truncate" style={{ color: "var(--text-body)" }}>
                <span className="font-mono text-[0.7rem] mr-2" style={{ color: "var(--text-on-ink-dim)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.path.replace("/story/", "")}
              </span>
              <span className="font-mono text-[0.68rem] shrink-0" style={{ color: "var(--brand-soft)" }}>
                {s.views} views
              </span>
            </Link>
          ))}
        </div>
      )}

      <h2 className="font-display text-lg font-bold mb-4" style={{ color: "var(--text-on-ink)" }}>
        Recent Feedback
      </h2>
      {stats.recentFeedback.length === 0 ? (
        <p className="text-[0.85rem]" style={{ color: "var(--text-on-ink-dim)" }}>
          No feedback yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {stats.recentFeedback.map((f) => (
            <div
              key={f.id}
              className="rounded-sm border p-4"
              style={{ background: "var(--ink-card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[0.62rem]" style={{ color: "var(--text-on-ink-dim)" }}>
                  {f.email || "Anonymous"}
                </span>
                <span className="font-mono text-[0.6rem]" style={{ color: "var(--text-on-ink-dim)" }}>
                  {new Date(f.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-[0.85rem]" style={{ color: "var(--text-body)" }}>
                {f.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border p-4" style={{ background: "var(--ink-card)", borderColor: "var(--border)" }}>
      <div className="font-mono text-[0.62rem] uppercase tracking-wide mb-1" style={{ color: "var(--text-on-ink-dim)" }}>
        {label}
      </div>
      <div className="font-display text-2xl font-bold" style={{ color: "var(--text-on-ink)" }}>
        {value}
      </div>
    </div>
  );
}

function AdminLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="block rounded-sm border p-5 hover:opacity-90"
      style={{ background: "var(--ink-card)", borderColor: "var(--border)" }}
    >
      <div className="font-display font-bold text-lg mb-1" style={{ color: "var(--text-on-ink)" }}>
        {title}
      </div>
      <div className="text-[0.85rem]" style={{ color: "var(--text-body)" }}>
        {description}
      </div>
    </Link>
  );
}

