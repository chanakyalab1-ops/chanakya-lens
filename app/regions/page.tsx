import NavDrawer from "@/components/NavDrawer";
import RegionsBrowser from "@/components/RegionsBrowser";
import { getAllStories } from "@/lib/stories";

export const revalidate = 60;

export default async function RegionsPage() {
  const stories = await getAllStories();

  return (
    <>
      <NavDrawer />
      <div className="px-5 pt-5.5 pb-4.5 border-b text-center" style={{ borderColor: "var(--border)" }}>
        <div className="font-mono text-[0.64rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-on-ink-dim)" }}>
          Browse by region
        </div>
        <div className="font-display text-lg font-semibold max-w-md mx-auto" style={{ color: "var(--text-body)" }}>
          Stories, sorted by where they&apos;re actually happening.
        </div>
      </div>
      <RegionsBrowser stories={stories} />
    </>
  );
}