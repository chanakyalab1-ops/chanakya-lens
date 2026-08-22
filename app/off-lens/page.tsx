import Link from "next/link";
import NavDrawer from "@/components/NavDrawer";

export default function OffLensPage() {
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
            Two things we look for
          </h2>
          <p className="text-[0.9rem] leading-relaxed mb-3" style={{ color: "#C6D0E8" }}>
            <strong style={{ color: "var(--text-on-ink)" }}>Coverage gaps</strong> -- a story with heavy reporting from one region and almost none from another, even when the second region has an obvious stake in the outcome.
          </p>
          <p className="text-[0.9rem] leading-relaxed" style={{ color: "#C6D0E8" }}>
            <strong style={{ color: "var(--text-on-ink)" }}>Framing gaps</strong> -- the same event, told as a different story depending on the outlet's national vantage point. Not bias in the left/right sense -- bias in whose interests the framing quietly serves.
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

        <section className="mb-8">
          <h2 className="font-display font-bold text-lg mb-2" style={{ color: "var(--brand-soft)" }}>
            A worked example
          </h2>
          <p className="text-[0.9rem] leading-relaxed mb-3" style={{ color: "#C6D0E8" }}>
            When Croatian police arrested a second suspect in the 2022 Nord Stream pipeline blasts, the coverage gap wasn't about who reported it -- it was about who was still investigating at all.
          </p>
          <p className="text-[0.9rem] leading-relaxed" style={{ color: "#C6D0E8" }}>
            Denmark and Sweden closed their own probes into the same explosions back in early 2024, citing jurisdictional limits. Germany didn't. That's not a detail buried in the story -- it's the story: one country still treating this as an active case while two others quietly stepped back tells you something about whose infrastructure was actually hit, and who has the standing to keep pursuing it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-display font-bold text-lg mb-2" style={{ color: "var(--brand-soft)" }}>
            Not every story earns this treatment
          </h2>
          <p className="text-[0.9rem] leading-relaxed" style={{ color: "#C6D0E8" }}>
            Some events are genuinely covered evenly across regions, with no meaningful gap to point out. When that's the case, we don't force an Off-Lens angle just to have one.
          </p>
        </section>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80"
          style={{ color: "var(--text-on-ink-dim)" }}
        >
          Back to feed
        </Link>
      </article>
    </>
  );
}