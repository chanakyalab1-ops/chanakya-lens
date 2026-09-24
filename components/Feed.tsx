"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Story } from "@/lib/stories";
import { formatStoryDate } from "@/lib/formatDate";
import { isOptimizableImageUrl } from "@/lib/imageHost";
const dotColor: Record<string, string> = {
  direct: "var(--direct)",
  likely: "var(--likely)",
  possible: "var(--possible)",
};
const dotLabel: Record<string, string> = {
  direct: "Direct — a concrete, near-certain mechanism",
  likely: "Likely — a plausible mechanism, real but less certain",
  possible: "Possible — a speculative but reasonable connection",
};
function Pill({
  children,
  color,
  borderColor,
  background,
  dot,
}: {
  children: React.ReactNode;
  color: string;
  borderColor: string;
  background: string;
  dot?: boolean;
}) {
  return (
    <span
      className="font-mono text-[0.58rem] uppercase tracking-wide rounded-full border px-2 py-0.5 flex items-center gap-1"
      style={{ color, borderColor, background }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />}
      {children}
    </span>
  );
}
function OffLensTeaser({ stories }: { stories: Story[] }) {
  const offLensStories = stories.filter((s) => s.offLens);
  return (
    <div
      className="flex flex-col rounded-sm border p-5"
      style={{ borderColor: "var(--brand-soft)", background: "var(--surface-strong)" }}
    >
      <Link href="/off-lens" className="hover:opacity-90">
        <div className="font-display font-bold uppercase tracking-wide text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
          Off-Lens
        </div> </Link>
      <p className="text-[0.88rem] leading-relaxed mb-4" style={{ color: "var(--text-body)" }}>
        Every story is reported from somewhere. Off-Lens shows who&apos;s covering it, from where, and where the framing splits by whose interest is at stake.
      </p>
      {offLensStories.length > 0 ? (
        <div className="flex flex-col gap-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          {offLensStories.slice(0, 6).map((story) => (
            <Link
              key={story.slug}
              href={`/story/${story.slug}`}
              className="text-[0.82rem] leading-snug hover:opacity-80"
              style={{ color: "var(--text-on-ink)" }}
            >
              {story.headline}
            </Link>
          ))}
        </div>
      ) : null}
      <Link
        href="/off-lens"
        className="mt-4 font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80"
        style={{ color: "var(--text-on-ink-dim)" }}
      >
        {offLensStories.length > 0 ? "See all →" : "Learn more →"}
      </Link>
    </div>
  );
}
function OffLensBadge() {
  return (
    <Pill dot color="var(--brand-soft)" borderColor="rgba(95,168,181,0.5)" background="rgba(95,168,181,0.08)">
      Off-Lens
    </Pill>
  );
}
function DevelopingBadge() {
  return (
    <Pill dot color="var(--developing)" borderColor="rgba(217,105,74,0.5)" background="rgba(217,105,74,0.08)">
      Developing
    </Pill>
  );
}
function CategoryBadge({ category }: { category: string }) {
  return (
    <Pill color="var(--brand-soft)" borderColor="rgba(95,168,181,0.35)" background="transparent">
      {category}
    </Pill>
  );
}
function ImpactLegend() {
  return (
    <div className="flex items-center gap-3 font-mono text-[0.6rem]" style={{ color: "var(--text-on-ink-dim)" }}>
      <span className="uppercase tracking-wide">Affects you if —</span>
      {(["direct", "likely", "possible"] as const).map((level) => (
        <span key={level} className="flex items-center gap-1" title={dotLabel[level]}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor[level] }} />
          <span className="capitalize">{level}</span>
        </span>
      ))}
    </div>
  );
}
function ImpactDots({ story }: { story: Story }) {
  return (
    <div className="flex gap-1">
      {story.impactNodes!.map((n, i) => (
        <span
          key={i}
          title={dotLabel[n.confidence]}
          className="h-1.5 w-1.5 rounded-full cursor-help"
          style={{ background: dotColor[n.confidence] }}
        />
      ))}
    </div>
  );
}

function HeroCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/story/${story.slug}`}
      className="block rounded-sm border p-5 md:p-6 mb-3 hover:opacity-95"
      style={{ background: "var(--surface-strong)", borderColor: "var(--brand-soft)" }}
    >
      {story.imageUrl && (
        <div className="relative w-full aspect-[3/1] rounded-sm overflow-hidden mb-3 -mt-1">
          <Image src={story.imageUrl} alt={story.headline} fill sizes="(max-width: 1023px) 100vw, 944px" className="object-cover" unoptimized={!isOptimizableImageUrl(story.imageUrl)} />
        </div>
      )}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <CategoryBadge category={story.category} />
        {story.status === "developing" && <DevelopingBadge />}
        {story.offLens && <OffLensBadge />}
      </div>
      <h2 className="font-display font-bold text-2xl md:text-3xl leading-tight mb-3">{story.headline}</h2>
      <p className="text-[0.95rem] mb-4 max-w-2xl line-clamp-2" style={{ color: "var(--text-body)" }}>{story.dek}</p>
      <div className="flex items-center gap-2.5 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
        <span className="font-mono text-[0.6rem] uppercase tracking-wide" style={{ color: "var(--text-on-ink-dim)" }}>Affects you if —</span>
        <ImpactDots story={story} />
        <span className="ml-auto font-mono text-[0.62rem]" style={{ color: "var(--text-on-ink-dim)" }}>
          {formatStoryDate(story.publishedAt)} · {story.readTime}
        </span>
      </div>
    </Link>
  );
}

function CompactCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/story/${story.slug}`}
      className="block rounded-sm border p-3.5"
      style={{ background: "var(--surface)", borderColor: "var(--surface-border)" }}
    >
      {story.imageUrl && (
        <div className="relative w-full aspect-[5/2] rounded-sm overflow-hidden mb-2.5">
          <Image src={story.imageUrl} alt={story.headline} fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 320px" className="object-cover" unoptimized={!isOptimizableImageUrl(story.imageUrl)} />
        </div>
      )}
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <CategoryBadge category={story.category} />
        {story.status === "developing" && <DevelopingBadge />}
        {story.offLens && <OffLensBadge />}
      </div>
      <h3 className="font-display font-bold text-[0.98rem] leading-tight mb-2">{story.headline}</h3>
      <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <ImpactDots story={story} />
        <span className="ml-auto font-mono text-[0.58rem]" style={{ color: "var(--text-on-ink-dim)" }}>
          {story.readTime}
        </span>
      </div>
    </Link>
  );
}

const CATEGORY_ROW_LIMIT = 6;

// Groups stories by category, in the order categories first appear, and
// caps each group so the homepage reads as curated sections rather than
// one long undifferentiated wall of cards.
function CategoryRail({
  category,
  stories,
  onSeeAll,
}: {
  category: string;
  stories: Story[];
  onSeeAll: () => void;
}) {
  const shown = stories.slice(0, CATEGORY_ROW_LIMIT);
  const hasMore = stories.length > CATEGORY_ROW_LIMIT;
  return (
    <section id={`cat-${category}`} className="mb-7 scroll-mt-24">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display font-bold text-base" style={{ color: "var(--text-on-ink)" }}>
          {category}
        </h2>
        {hasMore && (
          <button
            onClick={onSeeAll}
            className="font-mono text-[0.62rem] uppercase tracking-wide hover:opacity-80"
            style={{ color: "var(--brand-soft)" }}
          >
            See all {stories.length} →
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {shown.map((story) => (
          <CompactCard key={story.slug} story={story} />
        ))}
      </div>
    </section>
  );
}

export default function Feed({ stories, signalSlugs }: { stories: Story[]; signalSlugs?: string[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(stories.map((s) => s.category)))],
    [stories]
  );
  const [active, setActive] = useState("All");
  // Search now lives in the header (see HeaderSearch.tsx), which writes to
  // the `q` URL param -- read it here reactively rather than owning local
  // input state, since Feed no longer renders its own search box.
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
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

  // Only group into category rails on the unfiltered, no-search "All" view --
  // once someone picks a specific category or searches, show the flat,
  // complete list they actually asked for.
  const showRails = active === "All" && !query.trim();

  // On that same default landing view, the Today's Signal panel above the
  // feed already shows the top story -- skip it as the hero pick too so
  // the same headline doesn't appear twice in a row. Everything else
  // (including the other signal stories) still flows into the rails below
  // as normal -- this only changes which single story becomes the hero.
  const nonSignal = showRails && signalSlugs?.length ? treated.filter((s) => !signalSlugs.includes(s.slug)) : treated;
  const hero = nonSignal[0] ?? treated[0];
  const rest = treated.filter((s) => s.slug !== hero?.slug);
  const restByCategory = useMemo(() => {
    if (!showRails) return null;
    const map = new Map<string, Story[]>();
    for (const s of rest) {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category)!.push(s);
    }
    return map;
  }, [rest, showRails]);

  return (
    <>
      <div
        className="flex gap-2 py-3 px-[max(1rem,calc((100%-80rem)/2+1rem))] overflow-x-auto border-b backdrop-blur"
        style={{
          borderColor: "var(--border)",
          background: "var(--overlay)",
          maskImage: "linear-gradient(to right, black calc(100% - 28px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black calc(100% - 28px), transparent 100%)",
        }}
      >
        <div className="flex gap-2 w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                if (cat === "All") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="shrink-0 font-mono text-[0.66rem] uppercase tracking-wide whitespace-nowrap rounded-full border px-3 py-1.5 transition-colors"
              style={
                active === cat
                  ? { color: "var(--ink)", background: "var(--brand-soft)", borderColor: "var(--brand-soft)" }
                  : { color: "var(--text-on-ink)", borderColor: "var(--border)", background: "transparent" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      {treated.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-3">
          <ImpactLegend />
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 pb-16 lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 lg:items-start">
        <div>
          {hero && (
            <div className="mt-3">
              <HeroCard story={hero} />
            </div>
          )}

          {showRails && restByCategory ? (
            <div className="mt-4">
              {[...restByCategory.entries()].map(([category, catStories]) => (
                <CategoryRail
                  key={category}
                  category={category}
                  stories={catStories}
                  onSeeAll={() => setActive(category)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
              {rest.map((story) => (
                <CompactCard key={story.slug} story={story} />
              ))}
            </div>
          )}

          {briefs.length > 0 && (
            <div className="flex items-center gap-2 font-mono text-[0.62rem] pt-5.5 pb-1" style={{ color: "var(--text-on-ink-dim)" }}>
              More stories
              <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
            {briefs.map((story) => (
              <Link
                key={story.slug}
                href={`/story/${story.slug}`}
                className="block rounded-sm border p-3.5"
                style={{ background: "var(--surface)", borderColor: "var(--surface-border)" }}
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <CategoryBadge category={story.category} />
                  {story.offLens && <OffLensBadge />}
                </div>
                <h3 className="font-display font-bold text-[0.95rem] leading-tight mb-2">{story.headline}</h3>
                <div className="flex items-center pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <span className="font-mono text-[0.58rem] uppercase tracking-wide" style={{ color: "var(--text-on-ink-dim)" }}>Brief</span>
                  <span className="ml-auto font-mono text-[0.58rem]" style={{ color: "var(--text-on-ink-dim)" }}>{story.readTime}</span>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-8 text-center text-sm" style={{ color: "var(--text-on-ink-dim)" }}>
              {query ? `No stories match "${query}".` : "Nothing in this category today."}
            </div>
          )}

          <div className="mt-6 p-4 rounded-sm border border-dashed flex items-center justify-between gap-3" style={{ borderColor: "var(--border)" }}>
            <div className="text-[0.78rem]" style={{ color: "var(--text-on-ink-dim)" }}>
              <strong style={{ color: "var(--text-body)" }}>Not every story gets the full treatment.</strong> We only trace impact when the chain is real.
            </div>
            <Link href="/how-we-rate" className="text-[0.78rem] whitespace-nowrap underline" style={{ color: "var(--brand-soft)" }}>
              How we rate →
            </Link>
          </div>

          <div className="mt-6 lg:hidden">
            <OffLensTeaser stories={stories} />
          </div>
        </div>
        <aside className="hidden lg:block mt-3">
          <OffLensTeaser stories={stories} />
        </aside>
      </main>
    </>
  );
}




