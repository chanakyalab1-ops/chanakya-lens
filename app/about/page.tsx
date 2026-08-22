import NavDrawer from "@/components/NavDrawer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      <NavDrawer />
      <article className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide mb-5 hover:opacity-80"
          style={{ color: "var(--text-on-ink-dim)" }}
        >
          ← Back to feed
        </Link>

        <div className="font-mono text-[0.68rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>
          Our approach
        </div>

        <h1 className="font-display font-bold text-3xl leading-tight mb-6">
          Small events. Traceable consequences.
        </h1>

        <p className="text-[0.95rem] leading-relaxed mb-6" style={{ color: "#C6D0E8" }}>
          Most news tells you what happened. It rarely tells you why it should matter to you specifically — why a tariff announced in another hemisphere shows up on your grocery receipt, or why a naval dispute halfway around the world nudges the price at the pump. Chanakya Lens exists to trace that chain: from the headline, through the mechanism, to the place it actually reaches you.
        </p>

        <p className="text-[0.95rem] leading-relaxed mb-9" style={{ color: "#C6D0E8" }}>
          We're named after Kautilya (Chanakya), the ancient strategist who read events not as isolated incidents but as moves on a larger board — each one revealing leverage, intent, and consequence beneath the surface. That's the lens we try to apply to modern geopolitics: cold, structural, and honest about what's actually at stake.
        </p>

        <section className="mb-9">
          <h2 className="font-display font-bold text-xl mb-4" style={{ color: "var(--brand-soft)" }}>
            How a story is built
          </h2>
          <div className="space-y-4">
            <div>
              <div className="font-semibold text-[0.92rem] mb-1">The factual brief</div>
              <p className="text-[0.88rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                What happened, stated plainly — no spin, no forecasting. Every claim traces back to reporting you can read yourself.
              </p>
            </div>
            <div>
              <div className="font-semibold text-[0.92rem] mb-1">How could this affect you</div>
              <p className="text-[0.88rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                A confidence-tagged chain from the event to your actual life — your bills, your job, your commute. We only include this when the connection is real. Most stories don't get one, and that's intentional: a forced connection is worse than no connection at all.
              </p>
            </div>
            <div>
              <div className="font-semibold text-[0.92rem] mb-1">Chanakya's Move</div>
              <p className="text-[0.88rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                The strategic read underneath the public framing — what's actually being secured, threatened, or maneuvered, and who ends up holding the advantage. Scenario analysis, never prediction.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-9">
          <h2 className="font-display font-bold text-xl mb-4" style={{ color: "var(--brand-soft)" }}>
            What we won't do
          </h2>
          <ul className="space-y-3">
            <li className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              <strong style={{ color: "var(--text-on-ink)" }}>We don't forecast.</strong> Everything is framed as "could," never "will." This is scenario analysis, not a prediction market.
            </li>
            <li className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              <strong style={{ color: "var(--text-on-ink)" }}>We don't force relevance.</strong> Impact sections and strategic analysis are earned by the story, not applied automatically to every piece.
            </li>
            <li className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              <strong style={{ color: "var(--text-on-ink)" }}>We don't guess at the present.</strong> We won't characterize an unfolding situation — a ceasefire holding, tensions cooling — unless the sourcing actually confirms it.
            </li>
            <li className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              <strong style={{ color: "var(--text-on-ink)" }}>We don't publish without a human reading it first.</strong> Every story, however it's drafted, gets reviewed before it goes live. That step is permanent.
            </li>
          </ul>
        </section>

        <div className="pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-[0.85rem]" style={{ color: "var(--text-on-ink-dim)" }}>
            Curious how we weigh confidence and decide what's "Direct" versus "Possible"?{" "}
            <Link href="/how-we-rate" className="underline" style={{ color: "var(--brand-soft)" }}>
              Read how we rate this →
            </Link>
          </p>
        </div>
      </article>
    </>
  );
}