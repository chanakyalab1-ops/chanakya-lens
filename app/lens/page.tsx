import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import NavDrawer from "@/components/NavDrawer";
import { getAllStories } from "@/lib/stories";
import { THEMES, SYSTEMS, ACTORS, countriesByRegion, storiesFor, type LensEntity } from "@/lib/lens";

export const revalidate = 3600;

export const metadata: Metadata = pageMeta("/lens", "The Lens", "Permanent pages for the countries, actors and strategic systems that keep coming up: Hormuz, the Red Sea, Taiwan, semiconductors, trade corridors and more.");

function Card({ entity, count }: { entity: LensEntity; count: number }) {
  return (
    <Link
      href={`/lens/${entity.slug}`}
      className="block rounded-sm border p-4 hover:opacity-90"
      style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}
    >
      <div className="font-display font-bold text-lg leading-tight" style={{ color: "var(--text-on-ink)" }}>
        {entity.name}
      </div>
      <p className="text-[0.82rem] mt-1.5 leading-snug" style={{ color: "var(--text-body)" }}>
        {entity.tagline}
      </p>
      <div className="font-mono text-[0.62rem] uppercase tracking-wide mt-3" style={{ color: "var(--brand-soft)" }}>
        {count} {count === 1 ? "story" : "stories"}
      </div>
    </Link>
  );
}

export default async function LensIndexPage() {
  const stories = await getAllStories();
  const count = (e: LensEntity) => storiesFor(e, stories).length;

  return (
    <>
      <NavDrawer />
      <main className="max-w-6xl mx-auto px-5 pt-7 pb-16">
        <div className="max-w-2xl mb-9">
          <div className="font-mono text-[0.68rem] uppercase tracking-wide mb-3" style={{ color: "var(--brand-soft)" }}>
            Reference
          </div>
          <h1 className="font-display font-extrabold uppercase text-4xl md:text-5xl mb-4" style={{ color: "var(--text-on-ink)" }}>
            The Lens
          </h1>
          <p className="text-base" style={{ color: "var(--text-body)" }}>
            The places, powers and supply chains that keep coming back. Each page has the background in plain terms, why it matters, the latest coverage and which countries are reporting it.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="font-display font-bold text-xl mb-3" style={{ color: "var(--brand-soft)" }}>Storylines</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {THEMES.map((e) => <Card key={e.slug} entity={e} count={count(e)} />)}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-bold text-xl mb-3" style={{ color: "var(--brand-soft)" }}>Strategic systems</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SYSTEMS.map((e) => <Card key={e.slug} entity={e} count={count(e)} />)}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-bold text-xl mb-3" style={{ color: "var(--brand-soft)" }}>Actors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ACTORS.map((e) => <Card key={e.slug} entity={e} count={count(e)} />)}
          </div>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl mb-4" style={{ color: "var(--brand-soft)" }}>Countries</h2>
          {countriesByRegion().map(({ region, countries }) => (
            <div key={region} className="mb-5">
              <div className="font-mono text-[0.62rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-on-ink-dim)" }}>{region}</div>
              <div className="flex flex-wrap gap-2">
                {countries.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/lens/${c.slug}`}
                    className="font-mono text-[0.72rem] px-3 py-1.5 rounded-full border hover:opacity-80"
                    style={{ borderColor: "var(--border)", color: "var(--text-body)" }}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
