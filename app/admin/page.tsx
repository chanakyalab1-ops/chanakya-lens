import Link from "next/link";
export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";

async function getAnalyticsSummary() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { count: views24h } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
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
  const { count: totalFeedback } = await supabase
    .from("feedback_submissions")
    .select("*", { count: "exact", head: true });

  const { data: recentFeedback } = await supabase
    .from("feedback_submissions")
    .select("id, email, message, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    views24h: views24h ?? 0,
    totalStories: totalStories ?? 0,
    pendingCandidates: pendingCandidates ?? 0,
    draftsInReview: draftsInReview ?? 0,
    totalFeedback: totalFeedback ?? 0,
    recentFeedback: recentFeedback ?? [],
  };
}

export default async function AdminPage() {
  const stats = await getAnalyticsSummary();
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl font-bold mb-8" style={{ color: "var(--text-on-ink)" }}>
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <StatCard label="Views (24h)" value={stats.views24h} />
        <StatCard label="Published Stories" value={stats.totalStories} />
        <StatCard label="Pending Candidates" value={stats.pendingCandidates} />
        <StatCard label="Drafts in Review" value={stats.draftsInReview} />
        <StatCard label="Feedback" value={stats.totalFeedback} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <AdminLink href="/review" title="Review Queue" description="Generate and review story drafts from candidates." />
        <AdminLink href="/review/manage" title="Manage Published Stories" description="Edit or unpublish live stories." />
      </div>

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
