"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MarketTicker, { filterFreshRows, type MarketRow } from "@/components/MarketTicker";

const REFRESH_MS = 60_000;

// The chart code only loads once someone taps a price.
const MarketChart = dynamic(() => import("@/components/MarketChart"), { ssr: false });

// Server-rendered rows give the first paint; after that the ticker keeps
// itself current without waiting for the cached page to regenerate.
export default function LiveMarketTicker({ initialRows }: { initialRows: MarketRow[] }) {
  const [rows, setRows] = useState<MarketRow[]>(initialRows);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/market");
        if (!res.ok) return;
        const data = (await res.json()) as { rows?: MarketRow[] };
        // Staleness is judged here, at fetch time, not when the page was built.
        if (!cancelled && data.rows) setRows(filterFreshRows(data.rows));
      } catch {
        // Keep showing what we have; a failed refresh must never blank the ticker.
      }
    }
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <>
      <MarketTicker rows={rows} onSelect={(row) => setSelected(row.label)} />
      {selected && <MarketChart label={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
