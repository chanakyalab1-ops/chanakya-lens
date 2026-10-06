import Link from "next/link";
import type { MarketDataRow, QuoteResult } from "@/lib/marketData";
import { unreviewed } from "@/lib/pipelineBuffer";
import type { VercelTraffic } from "@/lib/vercelAnalytics";
import type { Overview } from "./data";
import type { AttentionItem } from "./attention";
import { timeAgo } from "./time";

export type MarketCheck = { symbol: string; label: string; cached: MarketDataRow | null; live: QuoteResult };

const card = { background: "var(--ink-card)", borderColor: "var(--border)" } as const;
const dim = { color: "var(--text-on-ink-dim)" } as const;
const mono = "font-mono text-[0.62rem] uppercase tracking-wide";

export function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-14 mb-12">
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--text-on-ink)" }}>{title}</h2>
      {hint && <p className="text-[0.8rem] mb-4 max-w-2xl" style={dim}>{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

export function SectionNav({ links }: { links: { href: string; label: string; badge?: number }[] }) {
  return (
    <nav
      className="sticky top-0 z-20 -mx-4 px-4 py-2.5 mb-8 flex gap-2 overflow-x-auto border-b backdrop-blur no-scrollbar"
      style={{ background: "var(--overlay)", borderColor: "var(--border)" }}
    >
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="shrink-0 font-mono text-[0.68rem] uppercase tracking-wide rounded-full border px-3 py-1.5 flex items-center gap-1.5"
          style={{ borderColor: "var(--border)", color: "var(--text-on-ink)" }}
        >
          {l.label}
          {l.badge ? (
            <span className="rounded-full px-1.5 text-[0.6rem]" style={{ background: "var(--brand-soft)", color: "var(--ink)" }}>
              {l.badge}
            </span>
          ) : null}
        </a>
      ))}
    </nav>
  );
}

export function Stat({ label, value, sub, href, highlight }: { label: string; value: number | string; sub?: string; href?: string; highlight?: boolean }) {
  const body = (
    <div className="rounded-sm border p-4 h-full" style={{ ...card, borderColor: highlight ? "var(--brand-soft)" : "var(--border)" }}>
      <div className={`${mono} mb-1`} style={dim}>{label}</div>
      <div className="font-display text-3xl font-bold leading-none" style={{ color: "var(--text-on-ink)" }}>{value}</div>
      {sub && <div className="text-[0.7rem] mt-1.5" style={dim}>{sub}</div>}
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body;
}

export function Meter({ label, value, max, note }: { label: string; value: number; max: number; note?: string }) {
  const ratio = max > 0 ? value / max : 1;
  const color = ratio >= 1 ? "var(--developing)" : ratio >= 0.7 ? "var(--likely)" : "var(--possible)";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={mono} style={dim}>{label}</span>
        <span className="font-mono text-[0.78rem]" style={{ color: "var(--text-on-ink)" }}>{value} / {max}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }} role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-label={label}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round(ratio * 100))}%`, background: color }} />
      </div>
      {note && <div className="text-[0.7rem] mt-1.5" style={dim}>{note}</div>}
    </div>
  );
}

export function AttentionBox({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-sm border p-4 mb-8 flex items-center gap-3" style={{ ...card, borderColor: "var(--possible)" }}>
        <span aria-hidden className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "var(--possible)" }} />
        <span className="text-[0.88rem]" style={{ color: "var(--text-on-ink)" }}>All clear. Nothing needs your attention right now.</span>
      </div>
    );
  }
  return (
    <div className="mb-8 flex flex-col gap-2">
      <div className={mono} style={dim}>Needs attention · {items.length}</div>
      {items.map((it, i) => {
        const inner = (
          <div className="rounded-sm border p-3.5 flex items-start gap-3" style={{ ...card, borderColor: it.level === "warn" ? "var(--developing)" : "var(--likely)" }}>
            <span aria-hidden className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5" style={{ background: it.level === "warn" ? "var(--developing)" : "var(--likely)" }} />
            <span className="text-[0.86rem] leading-snug" style={{ color: "var(--text-on-ink)" }}>{it.text}</span>
            {it.href && <span className="ml-auto shrink-0 font-mono text-[0.7rem]" style={{ color: "var(--brand-soft)" }}>Open →</span>}
          </div>
        );
        return it.href ? <Link key={i} href={it.href} className="block hover:opacity-90">{inner}</Link> : <div key={i}>{inner}</div>;
      })}
    </div>
  );
}

export function BufferPanel({ o }: { o: Overview }) {
  const { settings, backlog, plan, message } = o.buffer;
  const approval = settings.mode === "approve";
  const closed = !approval && plan.allow === 0;
  return (
    <div className="rounded-sm border p-4 md:p-5" style={{ ...card, borderColor: closed ? "var(--developing)" : "var(--border)" }}>
      <div className="flex items-start gap-3 mb-5">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5" style={{ background: closed ? "var(--developing)" : "var(--possible)" }} />
        <div>
          <div className="font-display font-bold text-lg leading-tight" style={{ color: "var(--text-on-ink)" }}>
            {approval ? "Approval mode" : settings.paused ? "Generation paused" : closed ? "Generation held" : "Generation open"}
          </div>
          <div className="text-[0.82rem] mt-0.5" style={{ color: "var(--text-body)" }}>
            {approval
              ? "Nothing is generated until you approve it. The buffer and caps below only apply if you switch to automatic mode."
              : message}
          </div>
          {approval && (
            <Link href="/review/proposals" className="inline-block mt-2 font-mono text-[0.72rem]" style={{ color: "var(--brand-soft)" }}>
              Review proposed stories →
            </Link>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <Meter label="Unreviewed drafts vs buffer" value={unreviewed(backlog)} max={settings.buffer}
          note={`${backlog.inReview} in review + ${backlog.factChecking} fact-checking + ${backlog.inFlight} still generating`} />
        <Meter label="Generated, last 24h vs daily cap" value={backlog.generated24h} max={settings.dailyCap}
          note={`${backlog.generated7d} in the last 7 days`} />
      </div>
      <details>
        <summary className="cursor-pointer font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: "var(--brand-soft)" }}>Buffer settings</summary>
        <p className="text-[0.76rem] mt-2 leading-relaxed" style={dim}>
          Set in Vercel environment variables (no redeploy of code needed, just a redeploy to pick them up):
          PIPELINE_BUFFER = {settings.buffer} · PIPELINE_DAILY_CAP = {settings.dailyCap} · PIPELINE_RUN_MAX = {settings.perRunMax} per run ·
          PIPELINE_PAUSED = {settings.paused ? "1 (paused)" : "unset"} · PIPELINE_MODE = {settings.mode} (&quot;approve&quot; waits for you, &quot;auto&quot; generates by itself within these limits). The Generate button in the review queue ignores the buffer.
        </p>
      </details>
    </div>
  );
}

export function Funnel({ o }: { o: Overview }) {
  const p = o.pipeline;
  const steps = [
    { label: "Candidates", value: p.candidatesPending, sub: "waiting to be picked up" },
    { label: "Generating", value: p.candidatesBatchPending, sub: `${p.batchesSubmitted} batch${p.batchesSubmitted === 1 ? "" : "es"} out` },
    { label: "Fact-check", value: p.factChecking, sub: p.factCheckFailed ? `${p.factCheckFailed} failed` : "in progress" },
    { label: "In review", value: p.inReview, sub: "waiting on you", href: "/review", highlight: true },
    { label: "Published", value: p.published, sub: `${p.rejected} rejected` },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {steps.map((s, i) => (
        // Five tiles in a two-column phone grid would leave a hole; let the last one span the row.
        <div key={s.label} className={i === steps.length - 1 ? "col-span-2 sm:col-span-1" : undefined}>
          <Stat label={`${i + 1}. ${s.label}`} value={s.value} sub={s.sub} href={s.href} highlight={s.highlight} />
        </div>
      ))}
    </div>
  );
}

export function BatchList({ batches }: { batches: Overview["pipeline"]["recentBatches"] }) {
  if (batches.length === 0) return null;
  return (
    <div className="mt-6">
      <div className={`${mono} mb-2`} style={dim}>Recent generation batches</div>
      <div className="flex flex-col gap-2">
        {batches.map((b) => (
          <div key={b.id} className="rounded-sm border px-3.5 py-2.5 flex items-center gap-3" style={card}>
            <span className="font-mono text-[0.68rem] truncate min-w-0 flex-1" style={{ color: "var(--text-body)" }}>{b.anthropic_batch_id}</span>
            <span className="font-mono text-[0.66rem] shrink-0" style={{ color: b.status === "submitted" ? "var(--likely)" : "var(--possible)" }}>{b.status}</span>
            <span className="font-mono text-[0.62rem] shrink-0 w-14 text-right" style={dim}>{timeAgo(b.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VercelTrafficPanel({ t }: { t: VercelTraffic }) {
  if (t.status !== "ok") {
    return (
      <div className="rounded-sm border px-3.5 py-3 mb-6" style={card}>
        <div className={`${mono} mb-1`} style={dim}>Vercel Analytics</div>
        <p className="text-[0.82rem]" style={{ color: "var(--text-body)" }}>
          {t.status === "unconfigured"
            ? "Not connected. Set VERCEL_ANALYTICS_TOKEN and VERCEL_PROJECT_ID (plus VERCEL_TEAM_ID for a team project) in Vercel, then redeploy."
            : `Could not load Vercel Analytics (${t.message}).`}
        </p>
      </div>
    );
  }
  const max = Math.max(1, ...t.referrers.map((r) => r.pageviews));
  return (
    <div className="mb-8">
      <div className={`${mono} mb-2`} style={dim}>Vercel Analytics (real visitors, bots filtered)</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Visitors, 24h" value={t.day.visitors.toLocaleString()} sub={`${t.day.pageviews.toLocaleString()} page views`} />
        <Stat label="Visitors, 30 days" value={t.month.visitors.toLocaleString()} sub={`${t.month.pageviews.toLocaleString()} page views`} />
      </div>
      <div className={`${mono} mb-2`} style={dim}>Where visitors came from, 30 days</div>
      {t.referrers.length === 0 ? (
        <p className="text-[0.85rem]" style={dim}>No data yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {t.referrers.map((r) => (
            <div key={r.host} className="relative rounded-sm border px-3.5 py-2.5 flex items-center gap-3 overflow-hidden" style={card}>
              <span aria-hidden className="absolute inset-y-0 left-0 opacity-15" style={{ width: `${(r.pageviews / max) * 100}%`, background: "var(--brand-soft)" }} />
              <span className="relative text-[0.84rem] min-w-0 flex-1 truncate" style={{ color: "var(--text-body)" }}>{r.host}</span>
              <span className="relative font-mono text-[0.68rem] shrink-0" style={{ color: "var(--brand-soft)" }}>{r.pageviews.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrafficPanel({ o }: { o: Overview }) {
  const max = Math.max(1, ...o.topStories.map((s) => s.views));
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Views, 24h" value={o.views24h.toLocaleString()} />
        <Stat label="Views, 30 days" value={o.views30d.toLocaleString()} />
        <Stat label="Published stories" value={o.totalStories} href="/review/manage" />
        <Stat label="Digest signups" value={o.digestSignups} />
      </div>
      <div className={`${mono} mb-2`} style={dim}>Top stories, 30 days</div>
      {o.topStories.length === 0 ? (
        <p className="text-[0.85rem]" style={dim}>No views yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {o.topStories.map((s, i) => (
            <Link key={s.path} href={s.path} className="relative rounded-sm border px-3.5 py-2.5 flex items-center gap-3 overflow-hidden hover:opacity-90" style={card}>
              <span aria-hidden className="absolute inset-y-0 left-0 opacity-15" style={{ width: `${(s.views / max) * 100}%`, background: "var(--brand-soft)" }} />
              <span className="relative font-mono text-[0.66rem] shrink-0" style={dim}>{String(i + 1).padStart(2, "0")}</span>
              <span className="relative text-[0.84rem] leading-snug min-w-0 flex-1 line-clamp-2" style={{ color: "var(--text-body)" }}>
                {s.headline ?? (s.path.replace("/story/", "") || "Homepage")}
              </span>
              <span className="relative font-mono text-[0.68rem] shrink-0" style={{ color: "var(--brand-soft)" }}>{s.views}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function MarketView({ checks }: { checks: MarketCheck[] }) {
  return (
    <div className="flex flex-col gap-2">
      {checks.map((m) => {
        const age = m.cached ? timeAgo(m.cached.updated_at) : null;
        return (
          <div key={m.symbol} className="rounded-sm border px-3.5 py-3" style={card}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[0.78rem]" style={{ color: "var(--brand-soft)" }}>{m.label}</span>
              <span className="font-mono text-[0.68rem]" style={{ color: m.live.ok ? "var(--possible)" : "var(--developing)" }}>
                {m.live.ok ? `✓ live ${m.live.quote.price}` : "✗ live check failed"}
              </span>
            </div>
            <div className="font-mono text-[0.64rem] mt-1" style={dim}>
              cached: {m.cached ? `${m.cached.price} · updated ${age}` : "no row yet"}
            </div>
            {!m.live.ok && <div className="text-[0.72rem] mt-1.5 break-words" style={{ color: "var(--developing)" }}>{m.live.reason}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function MarketSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-sm border h-[68px] animate-pulse" style={card} />
      ))}
    </div>
  );
}

export function FeedbackPanel({ o }: { o: Overview }) {
  if (o.recentFeedback.length === 0) return <p className="text-[0.85rem]" style={dim}>No feedback yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {o.recentFeedback.map((f) => (
        <div key={f.id} className="rounded-sm border p-4" style={card}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="font-mono text-[0.64rem] truncate" style={dim}>{f.email || "Anonymous"}</span>
            <span className="font-mono text-[0.62rem] shrink-0" style={dim}>{timeAgo(f.created_at)}</span>
          </div>
          <p className="text-[0.86rem] leading-relaxed whitespace-pre-wrap break-words" style={{ color: "var(--text-body)" }}>{f.message}</p>
        </div>
      ))}
    </div>
  );
}
