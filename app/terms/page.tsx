import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import NavDrawer from "@/components/NavDrawer";
import Link from "next/link";
import type { ReactNode } from "react";

const body = { color: "var(--text-body)" };
const heading = { color: "var(--brand-soft)" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-bold text-lg mb-3" style={heading}>{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[0.9rem] leading-relaxed" style={body}>{children}</p>;
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-[0.9rem] leading-relaxed" style={body}>{item}</li>
      ))}
    </ul>
  );
}

const Mail = () => (
  <a href="mailto:chanakya.lab1@gmail.com" className="underline" style={heading}>chanakya.lab1@gmail.com</a>
);

export const metadata: Metadata = pageMeta("/terms", "Terms of Service", "The terms for using Chanakya Lens.");

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

        <div className="font-mono text-[0.68rem] uppercase tracking-widest mb-3" style={heading}>
          Legal
        </div>

        <h1 className="font-display font-bold text-3xl leading-tight mb-2">Terms of Service</h1>
        <p className="text-[0.8rem] mb-8" style={{ color: "var(--text-on-ink-dim)" }}>
          Last updated October 2026
        </p>

        <div className="space-y-8">
          <Section title="What Chanakya Lens is">
            <P>
              Chanakya Lens publishes geopolitical news analysis: factual summaries, sourced coverage comparisons and strategic commentary. By using this site you agree to these terms. If you don&apos;t agree, please don&apos;t use it.
            </P>
          </Section>

          <Section title="Not financial, legal or professional advice">
            <P>
              Nothing on this site is financial, legal, investment or professional advice. Our strategic analysis, including the &ldquo;Chanakya&apos;s Move&rdquo; section, is scenario-based commentary, framed as what could happen and never as a prediction of what will happen. Don&apos;t make financial, legal or safety decisions based solely on what you read here.
            </P>
            <P>
              Market prices and charts shown on the site are indicative only. They may be delayed, incomplete or wrong, and must not be used for trading or investment decisions.
            </P>
          </Section>

          <Section title="AI-assisted content">
            <P>
              Many of our stories are drafted with the help of AI tools, then checked and approved by a person before they are published. AI-assisted content can contain mistakes or omissions even after review. Verify anything important against the original sources we link, and tell us if something is wrong.
            </P>
          </Section>

          <Section title="Content and sourcing">
            <P>
              We aim to trace every factual claim back to reporting you can verify, and we link our sources on every story. Coverage of unfolding events can still be incomplete or later superseded. Stories marked &ldquo;Developing&rdquo; are explicitly flagged as unsettled. Coverage comparisons, including the Off-Lens section, describe what outlets reported and how they framed it. They are not a verdict on whether any outlet is accurate or biased.
            </P>
            <P>
              See our <Link href="/how-we-rate" className="underline" style={heading}>How We Rate This</Link> page for how we handle confidence and sourcing.
            </P>
          </Section>

          <Section title="Third-party content and images">
            <P>
              Headlines, excerpts and links to other publishers&apos; reporting belong to those publishers, and we link to them so you can read the originals. Images on the site come from licensed or openly licensed sources or from the publishers&apos; own material, and remain the property of their owners. If you own content we have used and want it credited or removed, email <Mail /> and we will respond promptly.
            </P>
          </Section>

          <Section title="Accounts">
            <P>
              You can create an account with an email and password, or by signing in with Google. You&apos;re responsible for keeping your credentials secure and for what happens under your account. We may suspend accounts used to abuse the site or its infrastructure.
            </P>
          </Section>

          <Section title="Acceptable use">
            <P>You agree not to:</P>
            <List
              items={[
                "scrape the site at a volume or speed that affects other readers, or try to bypass rate limits or access controls;",
                "probe, attack or disrupt the site or its infrastructure;",
                "copy our stories in bulk or republish them as your own; short quotations with a link back to us are welcome;",
                "use the site for anything unlawful.",
              ]}
            />
            <P>
              You may share links to our stories and quote small excerpts with attribution. Our original text, analysis, design and branding remain ours.
            </P>
          </Section>

          <Section title="No warranty and limits on liability">
            <P>
              The site and its content are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind, including accuracy, completeness or fitness for a particular purpose. To the fullest extent the law allows, we are not liable for any loss or damage arising from your use of, or reliance on, the site or its content. Nothing in these terms limits any right or liability that cannot be limited by law.
            </P>
          </Section>

          <Section title="Privacy">
            <P>
              How we handle your personal data is described in our <Link href="/privacy" className="underline" style={heading}>Privacy Policy</Link>.
            </P>
          </Section>

          <Section title="Changes">
            <P>
              We may update these terms as the site evolves. The date at the top shows the latest revision, and continued use after a change means you accept the updated terms.
            </P>
          </Section>

          <Section title="Contact and corrections">
            <P>Questions about these terms, or spotted an error in a story? Email <Mail />.</P>
          </Section>
        </div>
      </article>
    </>
  );
}
