// Small pure helpers for the ticker's trend chart.
export type Pt = { t: number; v: number };

// Round tick values to clean numbers (95, 100, 105 rather than 96.31, 99.4).
export function niceTicks(min: number, max: number, count = 4): { ticks: number[]; step: number } {
  const span = max - min || Math.abs(max) * 0.01 || 1;
  const raw = span / Math.max(1, count);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / pow;
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10) * pow;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) ticks.push(Number(v.toPrecision(12)));
  return { ticks, step };
}

export function formatTick(v: number, step: number): string {
  const scaled = (n: number) => Math.abs(n - Math.round(n)) < 1e-9;
  const decimals = scaled(step) ? 0 : scaled(step * 10) ? 1 : 2;
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function linePath(xs: number[], ys: number[]): string {
  return xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
}

export function areaPath(xs: number[], ys: number[], baseline: number): string {
  if (xs.length === 0) return "";
  return `${linePath(xs, ys)} L${xs[xs.length - 1].toFixed(1)} ${baseline.toFixed(1)} L${xs[0].toFixed(1)} ${baseline.toFixed(1)} Z`;
}

export function nearestIndex(x: number, xs: number[]): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < xs.length; i++) {
    const d = Math.abs(xs[i] - x);
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  }
  return best;
}

export function changePercent(first: number, last: number): number | null {
  return first > 0 ? ((last - first) / first) * 100 : null;
}

// n entries spread evenly across the array, always including the first and last.
export function sampleEvenly<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(items[Math.round((i * (items.length - 1)) / (n - 1))]);
  return out;
}
