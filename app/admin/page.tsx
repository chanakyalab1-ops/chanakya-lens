import Link from "next/link";
import { Suspense } from "react";
import { MARKET_SYMBOLS, fetchQuoteFor, getMarketRows } from "@/lib/marketData";
import { getOverview } from "./data";
import { buildAttention } from "./attention";
import {
  AttentionBox, BatchList, BufferPanel, FeedbackPanel, Funnel, MarketSkeleton, MarketView,
  Section, SectionNav, TrafficPanel, type MarketCheck,
} from "./sections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Live-checks every ticker symbol (Twelve Data, then Yahoo -- the same path
// the cron takes), so the real reason one isn't showing is visible here.
// Sequential with a small gap: firing them all at once trips Twelve Data's
// rate limit and produces misleading 429s. It is slow, so it streams in
// behind a skeleton instead of holding up the rest of the page.
async function MarketPanel() {
  const rows = await getMarketRows();
  const bySymbol = new Map(rows.map((r) => [r.symbol, r]));
  const checks: MarketCheck[] = [];
  for (const cfg of MARKET_SYMBOLS) {
    checks.push({ symbol: cfg.symbol, label: cfg.label, cached: bySymbol.get(cfg.symbol) ?? null, live: await fetchQuoteFor(cfg) });
    await sleep(300);
  }
  return <MarketView checks={checks} />;
}

export default async function AdminPage() {
  const o = await getOverview();
  const attention = buildAttention(o);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text-on-ink)" }}>Admin</h1>
        <Link href="/" className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: "var(--text-on-ink-dim)" }}>← Site</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href="/review/proposals" className="col-span-2 block rounded-sm border p-4 hover:opacity-90" style={{ background: "var(--surface-strong)", borderColor: "var(--brand-soft)" }}>
          <div className="font-display font-bold text-lg" style={{ color: "var(--text-on-ink)" }}>Proposed stories</div>
          <div className="text-[0.78rem] mt-0.5" style={{ color: "var(--text-body)" }}>
            {o.buffer.settings.mode === "approve" ? "Approve what gets generated" : "Automatic mode is on. Open to generate by hand"}
          </div>
        </Link>
        <Link href="/review" className="block rounded-sm border p-4 hover:opacity-90" style={{ background: "var(--surface-strong)", borderColor: "var(--brand-soft)" }}>
          <div className="font-display font-bold text-lg" style={{ color: "var(--text-on-ink)" }}>Review queue</div>
          <div className="text-[0.78rem] mt-0.5" style={{ color: "var(--text-body)" }}>
            {o.pipeline.inReview} draft{o.pipeline.inReview === 1 ? "" : "s"} waiting
          </div>
        </Link>
        <Link href="/review/manage" className="block rounded-sm border p-4 hover:opacity-90" style={{ background: "var(--ink-card)", borderColor: "var(--border)" }}>
          <div className="font-display font-bold text-lg" style={{ color: "var(--text-on-ink)" }}>Manage stories</div>
          <div className="text-[0.78rem] mt-0.5" style={{ color: "var(--text-body)" }}>{o.totalStories} published</div>
        </Link>
      </div>

      <SectionNav
        links={[
          { href: "#pipeline", label: "Pipeline", badge: o.pipeline.inReview },
          { href: "#traffic", label: "Traffic" },
          { href: "#market", label: "Market" },
          { href: "#feedback", label: "Feedback", badge: o.feedbackCount },
        ]}
      />

      <AttentionBox items={attention} />

      <Section id="pipeline" title="Pipeline" hint="Articles in, stories out: candidates are picked up, generated, fact-checked, then wait for your review. Generation is held back when too many drafts are waiting.">
        <BufferPanel o={o} />
        <div className="mt-6">
          <Funnel o={o} />
        </div>
        <BatchList batches={o.pipeline.recentBatches} />
      </Section>

      <Section id="traffic" title="Traffic">
        <TrafficPanel o={o} />
      </Section>

      <Section id="market" title="Market ticker" hint="Live check calls the price sources right now. If a symbol fails here, that is the exact reason it is missing from the homepage ticker.">
        <Suspense fallback={<MarketSkeleton />}>
          <MarketPanel />
        </Suspense>
      </Section>

      <Section id="feedback" title="Feedback">
        <FeedbackPanel o={o} />
      </Section>
    </div>
  );
}
