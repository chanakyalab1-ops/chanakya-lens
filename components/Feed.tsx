"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Story } from "@/lib/stories";

const dotColor: Record<string, string> = {
  direct: "var(--direct)",
  likely: "var(--likely)",
  possible: "var(--possible)",
};

export default function Feed({ stories }: { stories: Story[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(stories.map((s) => s.category)))],
    [stories]
  );
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");

  const categoryFiltered = active === "All" ? stories : stories.filter((s) => s.category === active);
  const filtered = query.trim()
    ? categoryFiltered.filter((s) => {
        const q = query.trim().toLowerCase();
        return (
          s.headline.toLowerCase().includes(q) ||
          s.dek.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        );
      })
    : categoryFiltered;

  const treated = filtered.filter((s) => s.impactNodes?.length);
  const briefs = filtered.filter((s) => !s.impactNodes?.length);

  return (
    <>
      <div className="px-4 pt-3.5 pb-1 max-w-6xl mx-auto">
        <div className="relative">
          <svg viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-on-ink-dim)" }}>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories..."
            className="w-full md:max-w-sm rounded-full border pl-9 pr-9 py-2 text-sm outline-none"
            style={{ background: "var(--ink-card)", borderColor: "var(--border)", color: "var(--text-on-ink)" }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--text-on-ink-dim)" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto border-b sticky top-[57px] z-10 backdrop-blur"
        style={{ borderColor: "var(--border)", background: "rgba(10,17,42,0.92)" }}
      >
        <div className="flex gap-2 max-w-6xl mx-auto w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className="font-mono text-[0.66rem] uppercase tracking-wide whitespace-nowrap rounded-full border px-3 py-1.5 transition-colors"
              style={
                active === cat
                  ? { color: "var(--ink)", background: "var(--brand-soft)", borderColor: "var(--brand-soft)" }
                  : { color: "var(--text-on-ink-dim)", borderColor: "var(--border)", background: "transparent" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {treated.map((story) => (
            <Link
              key={story.slug}
              href={`/story/${story.slug}`}
              className="block rounded-sm border p-4"
              style={{ background: "var(--ink-card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="font-mono text-[0.62rem] uppercase tracking-wide" style={{ color: "var(--brand-soft)" }}>
                  {story.category}
                </span>
                {story.status === "developing" && (
                  <span
                    className="font-mono text-[0.58rem] uppercase tracking-wide rounded-full border px-2 py-0.5 flex items-center gap-1"
                    style={{ color: "var(--developing)", borderColor: "rgba(217,105,74,0.5)", background: "rgba(217,105,74,0.08)" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} /> Developing
                  </span>
                )}
                {story.hasVideo && (
                  <span className="ml-auto h-5 w-5 rounded-full flex items-center justify-center" style={{ background: "rgba(95,168,181,0.18)" }}>
                    <svg viewBox="0 0 12 14" fill="none" className="h-1.5 w-1.5">
                      <path d="M11 6.13a1 1 0 0 1 0 1.74L1.75 13.5A1 1 0 0 1 .25 12.63V1.37A1 1 0 0 1 1.75.5L11 6.13Z" fill="var(--brand-soft)" />
                    </svg>
                  </span>
                )}
              </div>
              <h2 className="font-display font-bold text-lg leading-tight mb-2">{story.headline}</h2>
              <p className="text-[0.83rem] mb-3" style={{ color: "var(--text-body)" }}>{story.dek}</p>
              <div className="flex items-center gap-2.5 pt-2.5 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="font-mono text-[0.6rem] uppercase tracking-wide" style={{ color: "var(--text-on-ink-dim)" }}>Affects you if —</span>
                <div className="flex gap-1">
                  {story.impactNodes!.map((n, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor[n.confidence] }} />
                  ))}
                </div>
                <span className="ml-auto font-mono text-[0.62rem]" style={{ color: "var(--text-on-ink-dim)" }}>{story.readTime}</span>
              </div>
            </Link>
          ))}
        </div>

        {briefs.length > 0 && (
          <div className="flex items-center gap-2 font-mono text-[0.62rem] pt-5.5 pb-1" style={{ color: "var(--text-on-ink-dim)" }}>
            Also today
            <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {briefs.map((story) => (
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
                <span className="font-mono text-[0.6rem] uppercase tracking-wide" style={{ color: "#7688B4" }}>Brief</span>
                <span className="ml-auto font-mono text-[0.62rem]" style={{ color: "var(--text-on-ink-dim)" }}>{story.readTime}</span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-8 text-center text-sm" style={{ color: "var(--text-on-ink-dim)" }}>
            {query ? `No stories match "${query}".` : "Nothing in this category today."}
          </div>
        )}

        <div className="mt-6 p-4 rounded-sm border border-dashed flex items-center justify-between gap-3" style={{ borderColor: "#2A3D74" }}>
          <div className="text-[0.78rem]" style={{ color: "var(--text-on-ink-dim)" }}>
            <strong style={{ color: "var(--text-body)" }}>Not every story gets the full treatment.</strong> We only trace impact when the chain is real.
          </div>
          <Link href="/how-we-rate" className="text-[0.78rem] whitespace-nowrap underline" style={{ color: "var(--brand-soft)" }}>
            How we rate →
          </Link>
        </div>
      </main>
    </>
  );
}