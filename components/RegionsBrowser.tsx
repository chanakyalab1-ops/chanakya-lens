"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Story } from "@/lib/stories";
import { REGIONS, Region, inferStoryRegion } from "@/lib/regions";

const TABS: Region[] = ["International", ...REGIONS];

export default function RegionsBrowser({ stories }: { stories: Story[] }) {
  const [active, setActive] = useState<Region>("International");

  const storiesWithRegion = useMemo(
    () => stories.map((s) => ({ story: s, region: inferStoryRegion(s) })),
    [stories]
  );

  const filtered =
    active === "International"
      ? storiesWithRegion
      : storiesWithRegion.filter((s) => s.region === active);

  return (
    <>
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex gap-2 max-w-7xl mx-auto w-full">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className="font-mono text-[0.66rem] uppercase tracking-wide whitespace-nowrap rounded-full border px-3 py-1.5 transition-colors"
              style={
                active === tab
                  ? { color: "var(--ink)", background: "var(--brand-soft)", borderColor: "var(--brand-soft)" }
                  : { color: "var(--text-on-ink-dim)", borderColor: "var(--border)", background: "transparent" }
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {filtered.map(({ story }) => (
            <Link
              key={story.slug}
              href={`/story/${story.slug}`}
              className="block rounded-sm border p-4"
              style={{ background: "var(--ink-card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className="font-mono text-[0.62rem] uppercase tracking-wide" style={{ color: "var(--brand-soft)" }}>
                  {story.category}
                </span>
              </div>
              <h2 className="font-display font-bold text-lg leading-tight mb-2">{story.headline}</h2>
              <p className="text-[0.83rem] mb-3" style={{ color: "var(--text-body)" }}>{story.dek}</p>
              <div className="flex items-center pt-2.5 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="ml-auto font-mono text-[0.62rem]" style={{ color: "var(--text-on-ink-dim)" }}>
                  {story.readTime}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-8 text-center text-sm" style={{ color: "var(--text-on-ink-dim)" }}>
            No stories from this region yet.
          </div>
        )}
      </main>
    </>
  );
}