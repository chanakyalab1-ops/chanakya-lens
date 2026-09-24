import { Suspense } from "react";
import NavDrawer from "@/components/NavDrawer";
import Feed from "@/components/Feed";
import Link from "next/link";
import { getAllStories, Story } from "@/lib/stories";
export const revalidate = 300;

function pickTodaysSignal(stories: Story[]): Story[] {
  const rank = (s: Story) => {
    const hasDirect = s.impactNodes?.some((n) => n.confidence === "direct");
    const isDeveloping = s.status === "developing";
    let score = 0;
    if (isDeveloping) score += 2;
    if (hasDirect) score += 1;
    return score;
  };
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const h48 = 48 * 60 * 60 * 1000;
  const recent = stories.filter((s) => now - new Date(s.publishedAt).getTime() < h24);
  const pool = recent.length >= 3 ? recent : stories.filter((s) => now - new Date(s.publishedAt).getTime() < h48);
  return [...pool]
    .sort((a, b) => rank(b) - rank(a) || (new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))
    .slice(0, 3);
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Chanakya Lens",
  "url": "https://chanakyalens.com",
  "description": "Geopolitical news analysis through an Indian strategic lens",
};

export default async function FeedPage() {
  const stories = await getAllStories();
  const signal = pickTodaysSignal(stories);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <NavDrawer />

      {signal.length > 0 && (
        <div className="sticky top-[73px] z-10 border-b overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>
          <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 py-2">
            <span className="font-mono text-[0.62rem] uppercase tracking-widest shrink-0" style={{ color: "var(--brand-soft)" }}>
              Signal
            </span>
            <div className="relative flex-1 overflow-hidden">
              <div className="ticker-track flex gap-10 whitespace-nowrap w-max">
                {[...signal, ...signal].map((story, i) => (
                  <Link
                    key={`${story.slug}-${i}`}
                    href={`/story/${story.slug}`}
                    aria-hidden={i >= signal.length || undefined}
                    tabIndex={i >= signal.length ? -1 : undefined}
                    className="flex items-center gap-2 text-sm hover:opacity-80"
                    style={{ color: "var(--text-on-ink)" }}
                  >
                    <span aria-hidden style={{ color: "var(--brand-soft)" }}>●</span>
                    {story.headline}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <Feed stories={stories} signalSlugs={signal.map((s) => s.slug)} />
      </Suspense>
    </>
  );
}


