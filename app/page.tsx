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
  return [...stories]
    .sort((a, b) => rank(b) - rank(a) || (new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))
    .slice(0, 3);
}

export default async function FeedPage() {
  const stories = await getAllStories();
  const signal = pickTodaysSignal(stories);

  return (
    <>
      <NavDrawer />

      {signal.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-5 pb-2">
          <div className="font-mono text-[0.64rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>
            Today&apos;s Signal — {signal.length} things actually moving the world
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {signal.map((story, i) => (
              <Link
                key={story.slug}
                href={`/story/${story.slug}`}
                className="block rounded-sm border p-4 hover:opacity-90"
                style={{ background: "#132340", borderColor: "var(--brand-soft)" }}
              >
                <div className="font-mono text-[0.7rem] mb-2" style={{ color: "var(--brand-soft)" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-display font-bold text-[0.95rem] leading-tight">{story.headline}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Feed stories={stories} />
    </>
  );
}


