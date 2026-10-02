import { Suspense } from "react";
import NavDrawer from "@/components/NavDrawer";
import Feed from "@/components/Feed";
import LiveMarketTicker from "@/components/LiveMarketTicker";
import { filterFreshRows } from "@/components/MarketTicker";
import { getAllStories, Story } from "@/lib/stories";
import { getMarketRows } from "@/lib/marketData";
export const revalidate = 3600;

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
  const [stories, marketRows] = await Promise.all([getAllStories(), getMarketRows()]);
  const signal = pickTodaysSignal(stories);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <NavDrawer />

      <LiveMarketTicker initialRows={filterFreshRows(marketRows)} />

      <Suspense fallback={null}>
        <Feed stories={stories} signalSlugs={signal.map((s) => s.slug)} />
      </Suspense>
    </>
  );
}


