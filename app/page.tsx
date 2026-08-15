import NavDrawer from "@/components/NavDrawer";
import Feed from "@/components/Feed";
import { getAllStories } from "@/lib/stories";

export const revalidate = 60; // re-fetch from Supabase at most once a minute

export default async function FeedPage() {
  const stories = await getAllStories();

  return (
    <>
      <NavDrawer />

      <div className="px-5 pt-5.5 pb-4.5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="font-mono text-[0.64rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-on-ink-dim)" }}>
          Today&apos;s signal
        </div>
        <div className="font-display text-2xl font-semibold max-w-md" style={{ color: "var(--text-body)" }}>
          Small events, traced to where they actually reach you.
        </div>
      </div>

      <Feed stories={stories} />
    </>
  );
}
