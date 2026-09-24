"use client";
import { useEffect } from "react";

// Fires once per real client-side page load, independent of the page's own
// server-side caching (see app/api/track-view/route.ts for why that matters
// on a statically-cached/ISR page).
export function PageViewBeacon({ path }: { path: string }) {
  useEffect(() => {
    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, [path]);

  return null;
}
