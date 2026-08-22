import NavDrawer from "@/components/NavDrawer";
import Link from "next/link";

export default function TermsPage() {
  return (
    <>
      <NavDrawer />
      <article className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide mb-5 hover:opacity-80"
          style={{ color: "var(--text-on-ink-dim)" }}
        >
          Back to feed
        </Link>

        <div className="font-mono text-[0.68rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>
          Legal
        </div>

        <h1 className="font-display font-bold text-3xl leading-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-[0.8rem] mb-8" style={{ color: "var(--text-on-ink-dim)" }}>
          Last updated August 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              What Chanakya Lens is
            </h2>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              Chanakya Lens publishes geopolitical news analysis: factual summaries, sourced coverage comparisons, and strategic commentary. By using this site, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              Not financial, legal, or professional advice
            </h2>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              Nothing on this site is financial, legal, investment, or professional advice. Our strategic analysis, including the "Chanakya's Move" section, is scenario-based commentary -- framed as what could happen, never a prediction of what will happen. Don't make financial, legal, or safety decisions based solely on what you read here.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              Accounts
            </h2>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              You can create an account with an email and password, or by signing in with Google. You're responsible for keeping your account credentials secure. We reserve the right to suspend accounts used to abuse the site or its infrastructure.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              Content and sourcing
            </h2>
            <p className="text-[0.9rem] leading-relaxed mb-3" style={{ color: "var(--text-body)" }}>
              We aim to trace every factual claim back to reporting you can independently verify, and we link our sources on every story. Despite that effort, coverage of unfolding events can be incomplete or later superseded -- stories marked "Developing" are explicitly flagged as unsettled.
            </p>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              See our{" "}
              <Link href="/how-we-rate" className="underline" style={{ color: "var(--brand-soft)" }}>
                How We Rate This
              </Link>{" "}
              page for how we handle confidence and sourcing.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              Changes
            </h2>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              We may update these terms as the site evolves. Continued use of the site after a change means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              Contact
            </h2>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              Questions about these terms? Reach us at{" "}
              <a href="mailto:chanakya.lab1@gmail.com" className="underline" style={{ color: "var(--brand-soft)" }}>
                chanakya.lab1@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </>
  );
}