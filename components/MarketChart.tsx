"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { areaPath, changePercent, formatTick, linePath, nearestIndex, niceTicks, sampleEvenly, type Pt } from "@/lib/chartMath";
import { formatChange, formatValue } from "@/components/MarketTicker";

const RANGES = ["5D", "1M", "3M", "1Y"] as const;
type Range = (typeof RANGES)[number];

const HEIGHT = 230;
const PAD = { top: 14, right: 54, bottom: 26, left: 4 };
const TZ = "Asia/Kolkata";

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: TZ, ...opts });
const AXIS_FMT: Record<Range, Intl.DateTimeFormat> = {
  "5D": fmt({ weekday: "short", day: "numeric" }),
  "1M": fmt({ day: "numeric", month: "short" }),
  "3M": fmt({ day: "numeric", month: "short" }),
  "1Y": fmt({ month: "short", year: "2-digit" }),
};
const TIP_FMT: Record<Range, Intl.DateTimeFormat> = {
  "5D": fmt({ weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }),
  "1M": fmt({ day: "numeric", month: "short", year: "numeric" }),
  "3M": fmt({ day: "numeric", month: "short", year: "numeric" }),
  "1Y": fmt({ day: "numeric", month: "short", year: "numeric" }),
};

function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

// Trend chart for one ticker symbol: a bottom sheet on phones, a dialog on
// desktop. History comes from /api/market/history, which is cached at the CDN.
export default function MarketChart({ label, onClose }: { label: string; onClose: () => void }) {
  const [range, setRange] = useState<Range>("1M");
  const [cache, setCache] = useState<Partial<Record<Range, Pt[]>>>({});
  const [failed, setFailed] = useState<Partial<Record<Range, boolean>>>({});
  // The last range that loaded: shown dimmed while the next one loads, so the sheet doesn't jump.
  const [lastGood, setLastGood] = useState<{ range: Range; points: Pt[] } | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [wrapRef, width] = useWidth();

  const current = cache[range];
  const error = !!failed[range];
  const loading = !current && !error;

  useEffect(() => {
    if (cache[range] || failed[range]) return;
    const controller = new AbortController();
    fetch(`/api/market/history?symbol=${encodeURIComponent(label)}&range=${range}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad response"))))
      .then((d: { points: Pt[] }) => {
        setCache((c) => ({ ...c, [range]: d.points }));
        setLastGood({ range, points: d.points });
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setFailed((f) => ({ ...f, [range]: true }));
      });
    return () => controller.abort();
  }, [label, range, cache, failed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const data = error ? null : current ?? lastGood?.points ?? null;
  const dataRange: Range = current ? range : lastGood?.range ?? range;
  const geom = useMemo(() => {
    if (!data || data.length < 2) return null;
    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const vals = data.map((p) => p.v);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const padV = (hi - lo || hi * 0.01) * 0.08;
    const yMin = lo - padV;
    const yMax = hi + padV;
    const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;
    // Index spacing, not clock spacing: markets close overnight and at weekends, and those gaps would flatten the line.
    const xs = data.map((_, i) => PAD.left + (i / (data.length - 1)) * plotW);
    const ys = vals.map(y);
    const { ticks, step } = niceTicks(yMin, yMax, 4);
    return { xs, ys, ticks, step, y, lo, hi, baseline: HEIGHT - PAD.bottom };
  }, [data, width]);

  const first = data?.[0];
  const last = data?.[data.length - 1];
  const change = first && last ? changePercent(first.v, last.v) : null;
  const idx = active !== null && data ? Math.min(active, data.length - 1) : null;
  const shownPoint = idx !== null && data ? data[idx] : last;
  const isUp = (change ?? 0) > 0;
  const isDown = (change ?? 0) < 0;
  const note = label === "USD/INR" ? "Exchange rate" : "Front-month futures";

  function onPointer(e: React.PointerEvent<SVGRectElement>) {
    if (!geom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActive(nearestIndex(e.clientX - rect.left, geom.xs));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!data) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const cur = active ?? data.length - 1;
      setActive(Math.max(0, Math.min(data.length - 1, cur + (e.key === "ArrowLeft" ? -1 : 1))));
    }
    if (e.key === "Home") setActive(0);
    if (e.key === "End") setActive(data.length - 1);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label={`${label} price chart`}>
      <div className="absolute inset-0" style={{ background: "rgba(5,10,25,0.55)" }} onClick={onClose} aria-hidden />
      <div
        className="relative w-full md:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-lg md:rounded-lg border p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        style={{ background: "var(--ink-card)", borderColor: "var(--border)", color: "var(--text-on-ink)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chart"
          className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center rounded-sm hover:opacity-70"
          style={{ color: "var(--text-on-ink-dim)" }}
          autoFocus
        >
          ✕
        </button>

        <div className="font-mono text-[0.7rem] uppercase tracking-widest" style={{ color: "var(--brand-soft)" }}>{label}</div>
        <div className="flex items-baseline gap-3 flex-wrap mt-1">
          <span className="font-display font-extrabold text-4xl leading-none">
            {shownPoint ? formatValue(label, shownPoint.v) : "—"}
          </span>
          {change !== null && (
            <span className="font-mono text-[0.8rem]" style={{ color: isUp ? "var(--possible)" : isDown ? "var(--developing)" : "var(--text-on-ink-dim)" }}>
              {isUp ? "▲" : isDown ? "▼" : "•"} {formatChange(change)} <span style={{ color: "var(--text-on-ink-dim)" }}>over {dataRange}</span>
            </span>
          )}
        </div>
        {geom && (
          <div className="font-mono text-[0.68rem] mt-1.5" style={{ color: "var(--text-on-ink-dim)" }}>
            Low {formatValue(label, geom.lo)} · High {formatValue(label, geom.hi)}
          </div>
        )}

        <div className="flex gap-1.5 mt-4 mb-3" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => {
                setActive(null);
                setRange(r);
              }}
              className="font-mono text-[0.72rem] uppercase tracking-wide rounded-full border px-3.5 py-1.5"
              style={
                range === r
                  ? { background: "var(--brand-soft)", borderColor: "var(--brand-soft)", color: "var(--ink)" }
                  : { borderColor: "var(--border)", color: "var(--text-on-ink)" }
              }
            >
              {r}
            </button>
          ))}
        </div>

        <div ref={wrapRef} className="relative" style={{ height: HEIGHT, opacity: loading && data ? 0.45 : 1, transition: "opacity .15s" }}>
          {error && !data && (
            <div className="absolute inset-0 flex items-center justify-center text-[0.85rem]" style={{ color: "var(--text-on-ink-dim)" }}>
              Chart unavailable right now. Try again in a minute.
            </div>
          )}
          {!data && !error && (
            <div className="absolute inset-0 rounded-sm animate-pulse" style={{ background: "var(--surface-border)" }} aria-busy="true" />
          )}
          {geom && data && (
            <div tabIndex={0} onKeyDown={onKeyDown} onBlur={() => setActive(null)} className="outline-none focus-visible:ring-1 rounded-sm" aria-label={`${label} ${dataRange} chart. Use the left and right arrow keys to read values.`}>
              <svg width={width} height={HEIGHT} role="img" aria-label={`${label} from ${formatValue(label, data[0].v)} to ${formatValue(label, data[data.length - 1].v)} over ${dataRange}`} style={{ display: "block", overflow: "visible" }}>
                {geom.ticks.map((t) => (
                  <g key={t}>
                    <line x1={PAD.left} x2={width - PAD.right} y1={geom.y(t)} y2={geom.y(t)} stroke="var(--border)" strokeWidth={1} />
                    <text x={width - PAD.right + 8} y={geom.y(t) + 3.5} fontSize={10} fill="var(--text-on-ink-dim)" fontFamily="var(--font-plex-mono), monospace">
                      {formatTick(t, geom.step)}
                    </text>
                  </g>
                ))}
                <path d={areaPath(geom.xs, geom.ys, geom.baseline)} fill="var(--brand-soft)" opacity={0.1} />
                <path d={linePath(geom.xs, geom.ys)} fill="none" stroke="var(--brand-soft)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i, k) => (
                  <text
                    key={i}
                    x={geom.xs[i]}
                    y={HEIGHT - 8}
                    fontSize={10}
                    textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
                    fill="var(--text-on-ink-dim)"
                    fontFamily="var(--font-plex-mono), monospace"
                  >
                    {AXIS_FMT[dataRange].format(data[i].t)}
                  </text>
                ))}
                <circle cx={geom.xs[geom.xs.length - 1]} cy={geom.ys[geom.ys.length - 1]} r={4.5} fill="var(--brand-soft)" stroke="var(--ink-card)" strokeWidth={2} />
                {idx !== null && (
                  <g pointerEvents="none">
                    <line x1={geom.xs[idx]} x2={geom.xs[idx]} y1={PAD.top} y2={geom.baseline} stroke="var(--text-on-ink-dim)" strokeWidth={1} opacity={0.6} />
                    <circle cx={geom.xs[idx]} cy={geom.ys[idx]} r={4.5} fill="var(--brand-soft)" stroke="var(--ink-card)" strokeWidth={2} />
                  </g>
                )}
                {/* Hit area is the whole plot, so the pointer only has to be near an x, never on the 2px line. */}
                <rect
                  x={0}
                  y={0}
                  width={width}
                  height={HEIGHT}
                  fill="transparent"
                  style={{ touchAction: "pan-y", cursor: "crosshair" }}
                  onPointerMove={onPointer}
                  onPointerDown={onPointer}
                  onPointerLeave={() => setActive(null)}
                />
              </svg>
              {idx !== null && (
                <div
                  className="absolute pointer-events-none rounded-sm border px-2.5 py-1.5"
                  style={{
                    top: 0,
                    left: Math.max(0, Math.min(width - 130, geom.xs[idx] - 65)),
                    width: 130,
                    background: "var(--ink-card)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="font-display font-bold text-[1rem] leading-tight">{formatValue(label, data[idx].v)}</div>
                  <div className="font-mono text-[0.62rem] mt-0.5" style={{ color: "var(--text-on-ink-dim)" }}>
                    {TIP_FMT[dataRange].format(data[idx].t)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-[0.7rem] mt-3" style={{ color: "var(--text-on-ink-dim)" }}>
          {note}. Indicative prices, may be delayed. Not investment advice.
        </p>

        {data && (
          <details className="mt-3">
            <summary className="cursor-pointer font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: "var(--brand-soft)" }}>
              View as table
            </summary>
            <table className="w-full mt-2 text-[0.78rem]" style={{ color: "var(--text-body)" }}>
              <thead>
                <tr style={{ color: "var(--text-on-ink-dim)" }} className="text-left font-mono text-[0.62rem] uppercase">
                  <th className="py-1 font-normal">Date</th>
                  <th className="py-1 font-normal text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {sampleEvenly(data, 12).map((p) => (
                  <tr key={p.t} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="py-1">{TIP_FMT[dataRange].format(p.t)}</td>
                    <td className="py-1 text-right font-mono">{formatValue(label, p.v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </div>
  );
}
