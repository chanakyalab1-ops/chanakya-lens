import Link from "next/link";
import NavDrawer from "@/components/NavDrawer";
import { getAllStories } from "@/lib/stories";

export const revalidate = 60;

export default async function OffLensPage() {
  const allStories = await getAllStories();
  const offLensStories = allStories.filter((s) => s.offLens);

  return (
    <>
      <NavDrawer />
      <article className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <div className="font-mono text-[0.68rem] uppercase tracking-wide mb-3.5" style={{ color: "var(--brand-soft)" }}>
          Methodology
        </div>
        <h1 className="font-display font-bold text-3xl leading-tight mb-4">
          Off-Lens
        </h1>
        <p className="text-base mb-8" style={{ color: "var(--text-body)" }}>
          Every story is reported from somewhere. Off-Lens is where we make that visible -- who's actually covering an event, from where, and where the framing splits depending on whose interest is at stake.
        </p>

        <section className="mb-8">
          <h2 className="font-display font-bold text-lg mb-2" style={{ color: "var(--brand-soft)" }}>
            We rate the coverage, not the event
          </h2>
          <p className="text-[0.9rem] leading-relaxed" style={{ color: "#C6D0E8" }}>
            Off-Lens isn't about whether a story is true. It's about whose vantage point it was reported from -- which countries have real coverage, which are conspicuously quiet, and where the same facts get told as a different story depending on who's telling it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-display font-bold text-lg mb-2" style={{ color: "var(--brand-soft)" }}>
            Not a political bias score
          </h2>
          <p className="text-[0.9rem] leading-relaxed" style={{ color: "#C6D0E8" }}>
            Off-Lens has nothing to do with left versus right. A story can be reported accurately by every outlet involved and still be Off-Lens, if it's only being told from one country's vantage point. The axis here is geography and national interest, not partisanship.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg mb-4" style={{ color: "var(--brand-soft)" }}>
            Stories with a coverage or framing gap
          </h2>

          {offLensStories.length === 0 && (
            <p className="text-[0.88rem]" style={{ color: "var(--text-on-ink-dim)" }}>
              Nothing qualifies right now -- we only flag a story here when the coverage itself reveals a real gap.
            </p>
          )}

          <div className="space-y-4">
            {offLensStories.map((story) => (
              <Link
                key={story.slug}
                href={`/story/${story.slug}`}
                className="block rounded-sm border p-4 hover:opacity-90"
                style={{ background: "var(--ink-card)", borderColor: "var(--border)" }}
              >
                <div className="font-mono text-[0.62rem] uppercase tracking-wide mb-2" style={{ color: "var(--brand-soft)" }}>
                  {story.category}
                </div>
                <h3 className="font-display font-bold text-lg leading-tight mb-2">{story.headline}</h3>
                <p className="text-[0.85rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                  {story.offLens}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-9">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80"
            style={{ color: "var(--text-on-ink-dim)" }}
          >
            Back to feed
          </Link>
        </div>
      </article>
    </>
  );
}