import type { Metadata } from "next";
import { Suspense } from "react";
import NavDrawer from "@/components/NavDrawer";
import Feed from "@/components/Feed";
import LiveMarketTicker from "@/components/LiveMarketTicker";
import { filterFreshRows } from "@/components/MarketTicker";
import { getAllStories } from "@/lib/stories";
import { pickTodaysSignal, recentWindow } from "@/lib/signal";
import { trendingTopics } from "@/lib/trending";
import { SYSTEMS, weeklyCounts } from "@/lib/lens";
import { getMarketRows } from "@/lib/marketData";
// The layout's relative canonical ("./") resolves to /index on the root route,
// which is a duplicate URL. Name the homepage explicitly. A page-level
// `alternates` replaces the layout's wholesale, so the RSS link is repeated.
export const metadata: Metadata = {
  title: "Chanakya Lens -- Geopolitics traced to what it means for you",
  description:
    "Daily geopolitics news and analysis. Each story traces a world event to its real-world chain of impact and shows which countries covered it, and how.",
  alternates: { canonical: "https://chanakyalens.com", types: { "application/rss+xml": "/rss.xml" } },
};

export const revalidate = 600;

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
  const recent = recentWindow(stories);
  const trending = trendingTopics(stories);
  const lensWeek = weeklyCounts(SYSTEMS, stories);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <NavDrawer />
      <h1 className="sr-only">Chanakya Lens: geopolitics traced to what it means for you</h1>

      <LiveMarketTicker initialRows={filterFreshRows(marketRows)} />

      <Suspense fallback={null}>
        <Feed stories={stories} signalSlugs={signal.map((s) => s.slug)} todayCount={recent.stories.length} windowLabel={recent.label} trending={trending} lensWeek={lensWeek} />
      </Suspense>
    </>
  );
}


