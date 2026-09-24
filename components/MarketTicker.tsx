// A stale ticker is worse than no ticker -- a symbol whose cache hasn't
// updated in a while (3x the 10-min cron cadence, giving room for a couple
// of missed cycles) is dropped rather than shown with an old value. If
// every symbol is stale, nothing renders at all. Staleness is computed by
// the caller (a Server Component reading `now` at request time) and passed
// in already filtered, so this component's render stays pure.
const STALE_AFTER_MS = 30 * 60 * 1000;

export type MarketRow = {
  symbol: string;
  label: string;
  price: number;
  change_percent: number | null;
  updated_at: string;
};

export function filterFreshRows(rows: MarketRow[]): MarketRow[] {
  const now = Date.now();
  return rows.filter((r) => now - new Date(r.updated_at).getTime() < STALE_AFTER_MS);
}

function formatValue(label: string, price: number): string {
  if (label === "GOLD") return `$${Math.round(price).toLocaleString()}`;
  if (label === "BRENT") return `$${price.toFixed(2)}`;
  return price.toFixed(2); // USD/INR is a plain exchange rate, no currency symbol
}

export default function MarketTicker({ rows: fresh }: { rows: MarketRow[] }) {
  if (fresh.length === 0) return null;

  return (
    <div className="border-b overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>
      <div className="max-w-7xl mx-auto flex items-center gap-5 px-4 py-1.5 font-mono text-[0.68rem] overflow-x-auto">
        {fresh.map((r) => {
          const isUp = (r.change_percent ?? 0) > 0;
          const isDown = (r.change_percent ?? 0) < 0;
          return (
            <span key={r.symbol} className="flex items-center gap-1.5 shrink-0">
              <span style={{ color: "var(--brand-soft)" }}>{r.label}</span>
              <span style={{ color: "var(--text-on-ink)" }}>{formatValue(r.label, r.price)}</span>
              {isUp && <span style={{ color: "var(--possible)" }}>▲</span>}
              {isDown && <span style={{ color: "var(--developing)" }}>▼</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
