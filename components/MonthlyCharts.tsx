import type { ChartKind } from '@/lib/miniMarkdown';
import type { MonthlyStats, Tally } from '@/lib/monthlyStats';

const TITLES: Record<ChartKind, string> = {
  countries: 'Where the news was: most-covered countries',
  chokepoints: 'Chokepoints and systems in the news',
  effects: 'How certain the effects were, by topic',
  regions: 'Stories by region',
};

function Bars({ rows, note, unit }: { rows: Tally[]; note?: string; unit: string }) {
  if (rows.length === 0) return <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>Nothing to show for this month.</p>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3">
            <span className="font-mono text-[0.75rem] w-32 shrink-0 truncate">{r.name}</span>
            <span className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }} aria-hidden>
              <span className="block h-full rounded-full" style={{ width: `${Math.round((r.count / max) * 100)}%`, background: 'var(--brand-soft)' }} />
            </span>
            <span className="font-mono text-[0.75rem] w-20 whitespace-nowrap text-right" style={{ color: 'var(--text-on-ink-dim)' }}>{r.count} {unit}</span>
          </li>
        ))}
      </ul>
      {note && <p className="text-[0.78rem] mt-3" style={{ color: 'var(--text-on-ink-dim)' }}>{note}</p>}
    </div>
  );
}

// One chart, drawn from the month's own data. Plain HTML bars with the numbers shown,
// so it reads on any screen and to screen readers.
export function MonthlyChart({ kind, stats }: { kind: ChartKind; stats: MonthlyStats }) {
  let body: React.ReactNode;
  if (kind === 'countries') body = <Bars rows={stats.countries} unit="stories" />;
  else if (kind === 'chokepoints') body = <Bars rows={stats.chokepoints} unit="stories" />;
  else if (kind === 'regions') {
    body = <Bars rows={stats.regions} unit="stories" note={stats.leastCovered ? `${stats.leastCovered} had the fewest stories this month.` : undefined} />;
  } else {
    body = stats.effects.length === 0 ? (
      <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>No rated effects this month.</p>
    ) : (
      <div>
        <ul className="space-y-3">
          {stats.effects.map((e) => {
            const total = e.direct + e.likely + e.possible;
            const pct = (n: number) => `${(n / total) * 100}%`;
            return (
              <li key={e.category}>
                <div className="flex justify-between text-[0.78rem] mb-1"><span className="font-mono">{e.category}</span><span className="font-mono" style={{ color: 'var(--text-on-ink-dim)' }}>{total}</span></div>
                <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5" role="img" aria-label={`${e.direct} direct, ${e.likely} likely, ${e.possible} possible`}>
                  <span style={{ width: pct(e.direct), background: 'var(--direct)' }} />
                  <span style={{ width: pct(e.likely), background: 'var(--likely)' }} />
                  <span style={{ width: pct(e.possible), background: 'var(--possible)' }} />
                </div>
                <div className="font-mono text-[0.6875rem] mt-1" style={{ color: 'var(--text-on-ink-dim)' }}>{e.direct} direct · {e.likely} likely · {e.possible} possible</div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return (
    <figure className="rounded-sm border p-4" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
      <figcaption className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-soft)' }}>{TITLES[kind]}</figcaption>
      {body}
    </figure>
  );
}
