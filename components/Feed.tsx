"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Story } from "@/lib/stories";
import { formatStoryDate } from "@/lib/formatDate";
import { isOptimizableImageUrl } from "@/lib/imageHost";
import { SYSTEMS } from "@/lib/lens";
import type { TrendingTopic } from "@/lib/trending";
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
        <div className="mb-3">
          <span className="sr-only">Off-Lens</span>
          <Image src="/offlens-logo.svg" alt="" width={492} height={90} unoptimized className="logo-for-light h-auto w-full max-w-[230px]" />
          <Image src="/offlens-logo-dark.svg" alt="" width={492} height={90} unoptimized className="logo-for-dark h-auto w-full max-w-[230px]" />
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
  // Stories without an impact chain (briefs) have none; the Lens and Today
  // pages list those alongside the rest.
  if (!story.impactNodes?.length) return null;
  return (
    <div className="flex gap-1">
      {story.impactNodes.map((n, i) => (
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

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

// Chanakya's Move is a full strategic-read paragraph -- the card only has
// room for a teaser, so pull just the first sentence rather than truncating
// mid-thought.
function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : text).trim();
}

function MoveLine({ analysis }: { analysis: string }) {
  return (
    <p className="flex items-start gap-1.5 text-[0.78rem] leading-snug mb-2" style={{ color: "var(--text-on-ink-dim)" }}>
      <span aria-hidden className="shrink-0" style={{ color: "var(--brand-soft)" }}>♟</span>
      <span>
        <span className="font-mono text-[0.6rem] uppercase tracking-wide mr-1.5" style={{ color: "var(--brand-soft)" }}>
          Move
        </span>
        {truncate(firstSentence(analysis), 120)}
      </span>
    </p>
  );
}

const CONFIDENCE_PRIORITY: Record<string, number> = { direct: 0, likely: 1, possible: 2 };

// Top 2-3 impact nodes, most-certain first -- a card has room for a
// glanceable summary, not the full "How Could This Affect You" list.
function ImpactChips({ nodes }: { nodes: Story["impactNodes"] }) {
  const top = [...nodes!].sort((a, b) => CONFIDENCE_PRIORITY[a.confidence] - CONFIDENCE_PRIORITY[b.confidence]).slice(0, 3);
  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-2">
      <span className="font-mono text-[0.58rem] uppercase tracking-wide shrink-0" style={{ color: "var(--text-on-ink-dim)" }}>
        Affects:
      </span>
      {top.map((n, i) => (
        <span
          key={i}
          title={n.mechanism}
          className="inline-flex items-center gap-1 font-mono text-[0.62rem] rounded-full border px-2 py-0.5 max-w-full"
          style={{ color: dotColor[n.confidence], borderColor: dotColor[n.confidence], background: "transparent" }}
        >
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: dotColor[n.confidence] }} />
          <span className="truncate">{truncate(n.audience, 32)}</span>
        </span>
      ))}
    </div>
  );
}

function HeroCard({ story }: { story: Story }) {
  return (
    <>
      {/* Phones: edge-to-edge image, big headline, no card chrome */}
      <Link href={`/story/${story.slug}`} className="md:hidden block -mx-4 mb-1">
        {story.imageUrl && (
          <div className="relative w-full aspect-[16/10] overflow-hidden">
            <Image src={story.imageUrl} alt={story.headline} fill priority sizes="100vw" className="object-cover" unoptimized={!isOptimizableImageUrl(story.imageUrl)} />
          </div>
        )}
        <div className="px-4 pt-3 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <CategoryBadge category={story.category} />
            {story.status === "developing" && <DevelopingBadge />}
            {story.offLens && <OffLensBadge />}
          </div>
          <h2 className="font-display font-bold text-[1.7rem] leading-[1.12] mb-2">{story.headline}</h2>
          <p className="text-[0.9rem] line-clamp-2 mb-3" style={{ color: "var(--text-body)" }}>{story.dek}</p>
          <div className="flex items-center gap-2.5">
            {story.impactNodes && story.impactNodes.length > 0 && <ImpactDots story={story} />}
            <span className="font-mono text-[0.62rem]" style={{ color: "var(--text-on-ink-dim)" }}>
              {formatStoryDate(story.publishedAt)}
            </span>
          </div>
        </div>
      </Link>
      <Link
        href={`/story/${story.slug}`}
        className="hidden md:block rounded-sm border p-5 md:p-6 mb-3 hover:opacity-95"
        style={{ background: "var(--surface-strong)", borderColor: "var(--brand-soft)" }}
      >
        {story.imageUrl && (
          <div className="relative w-full aspect-[3/1] rounded-sm overflow-hidden mb-3 -mt-1">
            <Image src={story.imageUrl} alt={story.headline} fill sizes="944px" className="object-cover" unoptimized={!isOptimizableImageUrl(story.imageUrl)} />
          </div>
        )}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <CategoryBadge category={story.category} />
          {story.status === "developing" && <DevelopingBadge />}
          {story.offLens && <OffLensBadge />}
        </div>
        <h2 className="font-display font-bold text-3xl leading-tight mb-3">{story.headline}</h2>
        <p className="text-[0.95rem] mb-4 max-w-2xl line-clamp-2" style={{ color: "var(--text-body)" }}>{story.dek}</p>
        {story.chanakyaAnalysis && <MoveLine analysis={story.chanakyaAnalysis} />}
        {story.impactNodes && story.impactNodes.length > 0 && <ImpactChips nodes={story.impactNodes} />}
        <div className="flex items-center gap-2.5 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <span className="font-mono text-[0.6rem] uppercase tracking-wide" style={{ color: "var(--text-on-ink-dim)" }}>Affects you if —</span>
          <ImpactDots story={story} />
          <span className="ml-auto font-mono text-[0.62rem]" style={{ color: "var(--text-on-ink-dim)" }}>
            {formatStoryDate(story.publishedAt)}
          </span>
        </div>
      </Link>
    </>
  );
}

export function CompactCard({ story }: { story: Story }) {
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
      {story.chanakyaAnalysis && <MoveLine analysis={story.chanakyaAnalysis} />}
      {story.impactNodes && story.impactNodes.length > 0 && <ImpactChips nodes={story.impactNodes} />}
      <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <ImpactDots story={story} />
        <span className="ml-auto font-mono text-[0.58rem]" style={{ color: "var(--text-on-ink-dim)" }}>
          {formatStoryDate(story.publishedAt)}
        </span>
      </div>
    </Link>
  );
}

// Ground News-style list row for phones: headline + meta on the left,
// square thumbnail on the right. Desktop keeps CompactCard.
export function MobileRow({ story }: { story: Story }) {
  return (
    <Link
      href={`/story/${story.slug}`}
      className="flex gap-3 py-3.5 border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-1.5 font-mono text-[0.58rem] uppercase tracking-wide">
          <span style={{ color: "var(--brand-soft)" }}>{story.category}</span>
          {story.status === "developing" && (
            <span className="flex items-center gap-1" style={{ color: "var(--developing)" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
              Developing
            </span>
          )}
          {story.offLens && (
            <span className="flex items-center gap-1" style={{ color: "var(--brand-soft)" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
              Off-Lens
            </span>
          )}
        </div>
        <h3 className="font-display font-bold text-[1.08rem] leading-[1.2] line-clamp-4">{story.headline}</h3>
        <div className="mt-auto pt-2 flex items-center gap-2">
          {story.impactNodes && story.impactNodes.length > 0 && <ImpactDots story={story} />}
          <span className="font-mono text-[0.58rem]" style={{ color: "var(--text-on-ink-dim)" }}>
            {formatStoryDate(story.publishedAt)}
          </span>
        </div>
      </div>
      {story.imageUrl && (
        <div className="relative shrink-0 w-[104px] h-[104px] rounded-md overflow-hidden self-start">
          <Image src={story.imageUrl} alt="" fill sizes="104px" className="object-cover" unoptimized={!isOptimizableImageUrl(story.imageUrl)} />
        </div>
      )}
    </Link>
  );
}

// "Today's Signal": the few stories that matter most right now, set beside the
// hero. Picked on the server (recent, still developing, with a direct impact)
// and passed in as slugs.
export function SignalPanel({ stories, moreCount, moreLabel = "More from today", plainHeading }: { stories: Story[]; moreCount?: number; moreLabel?: string; plainHeading?: boolean }) {
  return (
    <section
      aria-label="Today's Signal"
      className="rounded-sm border p-4 flex flex-col"
      style={{ background: "var(--surface-strong)", borderColor: "var(--border)" }}
    >
      {/* The logo comes in a dark-ink and a light-ink version; globals.css shows the one that suits the theme. */}
      {plainHeading ? (
        // The page already shows the logo (e.g. /today), so don't repeat it.
        <h2 className="font-mono text-[0.68rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>
          Top signals
        </h2>
      ) : (
        <h2 className="mb-2">
          <span className="sr-only">Today&apos;s Signal</span>
          <Image src="/todays-signal-logo.png" alt="" width={924} height={162} className="logo-for-light h-auto w-full max-w-[240px]" />
          <Image src="/todays-signal-logo-dark.png" alt="" width={924} height={162} className="logo-for-dark h-auto w-full max-w-[240px]" />
        </h2>
      )}
      <p className="hidden lg:block text-[0.72rem] mb-1" style={{ color: "var(--text-on-ink-dim)" }}>
        What moved most, in a glance.
      </p>
      <div className="mb-2" />
      <ol className="flex flex-col">
        {stories.map((story, i) => (
          <li key={story.slug} className={i > 0 ? "border-t" : undefined} style={{ borderColor: "var(--border)" }}>
            <Link href={`/story/${story.slug}`} className="flex gap-3 py-2.5 lg:py-3 hover:opacity-80">
              <span className="font-display font-extrabold text-2xl leading-none w-6 lg:w-7 shrink-0" style={{ color: "var(--brand-soft)" }}>
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-mono text-[0.58rem] uppercase tracking-wide mb-1" style={{ color: "var(--text-on-ink-dim)" }}>
                  {story.category}
                  {story.status === "developing" && (
                    <span className="flex items-center gap-1" style={{ color: "var(--developing)" }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
                      Developing
                    </span>
                  )}
                </span>
                <span className="block font-display font-bold text-[1rem] leading-tight line-clamp-2 lg:line-clamp-3">{story.headline}</span>
                <span className="hidden lg:block font-mono text-[0.58rem] mt-1.5" style={{ color: "var(--text-on-ink-dim)" }}>
                  {formatStoryDate(story.publishedAt)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {moreCount !== undefined && moreCount > stories.length && (
        <Link
          href="/today"
          className="mt-1 pt-3 border-t font-mono text-[0.7rem] uppercase tracking-wide hover:opacity-80 flex items-center justify-between"
          style={{ borderColor: "var(--border)", color: "var(--brand-soft)" }}
        >
          <span>{moreLabel}</span>
          <span>{moreCount} stories →</span>
        </Link>
      )}
    </section>
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
        <h2 className="font-display font-bold text-xl md:text-base" style={{ color: "var(--text-on-ink)" }}>
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
      <div className="md:hidden">
        {shown.map((story) => (
          <MobileRow key={story.slug} story={story} />
        ))}
      </div>
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {shown.map((story) => (
          <CompactCard key={story.slug} story={story} />
        ))}
      </div>
    </section>
  );
}

// The Lens on the homepage: the five strategic systems, each a permanent page.
// The count is the stories on it this past week, so the cards feel live.
function LensBand({ weekly }: { weekly?: Record<string, number> }) {
  return (
    <section className="mt-6" aria-labelledby="lens-band">
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <div>
          <h2 id="lens-band" className="font-display font-bold text-xl">The Lens</h2>
          <p className="text-[0.78rem] mt-0.5" style={{ color: "var(--text-on-ink-dim)" }}>
            The places, powers and supply chains behind the news.
          </p>
        </div>
        <Link href="/lens" className="shrink-0 font-mono text-[0.66rem] uppercase tracking-wide hover:opacity-80" style={{ color: "var(--brand-soft)" }}>
          See all →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-5">
        {SYSTEMS.map((e) => {
          const n = weekly?.[e.slug] ?? 0;
          return (
            <Link
              key={e.slug}
              href={`/lens/${e.slug}`}
              className="shrink-0 w-[62%] sm:w-[40%] md:w-auto flex flex-col rounded-sm border p-3.5 hover:opacity-90"
              style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}
            >
              <span className="font-display font-bold text-[1.05rem] leading-tight" style={{ color: "var(--text-on-ink)" }}>{e.name}</span>
              <span className="text-[0.76rem] leading-snug mt-1.5 line-clamp-3" style={{ color: "var(--text-body)" }}>{e.tagline}</span>
              <span className="mt-auto pt-2.5 font-mono text-[0.6rem] uppercase tracking-wide" style={{ color: "var(--brand-soft)" }}>
                {n > 0 ? `${n} ${n === 1 ? "story" : "stories"} this week` : "Explore →"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TrendingRow({ topics }: { topics: TrendingTopic[] }) {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-3 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
      <span className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest" style={{ color: "var(--brand-soft)" }}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M2 12l4-4 3 3 5-6" />
          <path d="M10 5h4v4" />
        </svg>
        Trending
      </span>
      {topics.map((t) => (
        <Link
          key={t.slug}
          href={`/lens/${t.slug}`}
          className="shrink-0 font-mono text-[0.68rem] whitespace-nowrap rounded-full border px-3 py-1 transition-colors hover:opacity-80"
          style={{ color: "var(--text-body)", borderColor: "var(--border)" }}
        >
          {t.name}
        </Link>
      ))}
    </div>
  );
}

export default function Feed({ stories, signalSlugs, todayCount, windowLabel, trending, lensWeek }: { stories: Story[]; signalSlugs?: string[]; todayCount?: number; windowLabel?: string; trending?: TrendingTopic[]; lensWeek?: Record<string, number> }) {
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
  // Same condition as above: the panel only shows on the plain landing view.
  const signalStories =
    showRails && signalSlugs?.length
      ? signalSlugs.map((slug) => stories.find((s) => s.slug === slug)).filter((s): s is Story => !!s)
      : [];
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
        className="flex gap-2 py-2.5 md:py-3 px-[max(1rem,calc((100%-80rem)/2+1rem))] overflow-x-auto border-b backdrop-blur no-scrollbar sticky top-0 md:static z-10"
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
      {trending && trending.length > 0 && (
        <TrendingRow topics={trending} />
      )}
      {treated.length > 0 && (
        <div className="hidden md:block max-w-7xl mx-auto px-4 pt-3">
          <ImpactLegend />
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 pb-16 lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 lg:items-start">
        <div>
          {(hero || signalStories.length > 0) && (
            <div className={signalStories.length > 0 ? "mt-3 lg:grid lg:grid-cols-[280px_1fr] lg:gap-4 lg:items-start" : "mt-3"}>
              {signalStories.length > 0 && <SignalPanel stories={signalStories} moreCount={todayCount} moreLabel={windowLabel ? `More from the ${windowLabel}` : undefined} />}
              {hero && (
                <div className={signalStories.length > 0 ? "mt-3 lg:mt-0" : undefined}>
                  <HeroCard story={hero} />
                </div>
              )}
            </div>
          )}

          {showRails && <LensBand weekly={lensWeek} />}

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
            <>
              <div className="md:hidden mt-1">
                {rest.map((story) => (
                  <MobileRow key={story.slug} story={story} />
                ))}
              </div>
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
                {rest.map((story) => (
                  <CompactCard key={story.slug} story={story} />
                ))}
              </div>
            </>
          )}

          {briefs.length > 0 && (
            <div className="flex items-center gap-2 font-mono text-[0.62rem] pt-5.5 pb-1" style={{ color: "var(--text-on-ink-dim)" }}>
              More stories
              <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
          )}
          <div className="md:hidden">
            {briefs.map((story) => (
              <MobileRow key={story.slug} story={story} />
            ))}
          </div>
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
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
                {story.chanakyaAnalysis && <MoveLine analysis={story.chanakyaAnalysis} />}
                <div className="flex items-center pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <span className="font-mono text-[0.58rem] uppercase tracking-wide" style={{ color: "var(--text-on-ink-dim)" }}>Brief</span>
                  <span className="ml-auto font-mono text-[0.58rem]" style={{ color: "var(--text-on-ink-dim)" }}>{formatStoryDate(story.publishedAt)}</span>
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




