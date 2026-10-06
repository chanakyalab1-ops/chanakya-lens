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

const B = ({ children }: { children: ReactNode }) => <strong style={{ color: "var(--text-on-ink)" }}>{children}</strong>;
const Mail = () => (
  <a href="mailto:chanakya.lab1@gmail.com" className="underline" style={heading}>chanakya.lab1@gmail.com</a>
);

export const metadata = { title: "Privacy Policy", description: "How Chanakya Lens collects, uses and protects your personal data." };

export default function PrivacyPage() {
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

        <h1 className="font-display font-bold text-3xl leading-tight mb-2">Privacy Policy</h1>
        <p className="text-[0.8rem] mb-8" style={{ color: "var(--text-on-ink-dim)" }}>
          Last updated October 2026
        </p>

        <div className="space-y-8">
          <Section title="Who we are">
            <P>
              Chanakya Lens (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs chanakyalens.com, a geopolitics news and analysis site. We are the party responsible for the personal data described here. You can reach us at <Mail />.
            </P>
          </Section>

          <Section title="What we collect">
            <P><B>Reading the site needs no account.</B> If you create one, or use optional features, we collect:</P>
            <List
              items={[
                <><B>Account details:</B> your email address and, if you sign up with a password, a securely hashed version of it. We never see or store your password in plain text.</>,
                <><B>Google sign-in:</B> if you choose it, we receive your name, email address and profile photo from Google, and nothing else. We never post on your behalf or access your other Google data.</>,
                <><B>Daily digest:</B> your email address and the topics you choose, so we can send you the digest.</>,
                <><B>Saved stories:</B> the stories you save, stored against your account.</>,
                <><B>Feedback:</B> anything you send us through a feedback form, and your email if you include it.</>,
                <><B>Basic usage data:</B> the page you visited, the browser type (user agent) and the page that referred you. We use this to see which stories are read. It isn&apos;t linked to your account, and we don&apos;t store your IP address in these records. Our hosting provider may keep standard server logs, which include IP addresses, for security and operations.</>,
              ]}
            />
          </Section>

          <Section title="How we use it">
            <List
              items={[
                "To run your account, sign you in and show you your saved stories.",
                "To send the daily digest you asked for.",
                "To understand which content is read, so we can improve the site.",
                "To keep the site secure and prevent abuse.",
                "To respond when you contact us.",
              ]}
            />
            <P>
              Where the law requires a legal basis, we rely on your consent (digest, optional features), our need to provide the service you asked for (account), and our legitimate interest in running and securing a news site (usage data, security).
            </P>
          </Section>

          <Section title="What we don't do">
            <List
              items={[
                "We don't sell your data.",
                "We don't run third-party advertising or ad-tracking scripts.",
                "We don't share your personal data with anyone outside the service providers listed below.",
              ]}
            />
          </Section>

          <Section title="Who handles data for us">
            <P>A small number of providers help us run the site, and your data passes through them as part of normal operation:</P>
            <List
              items={[
                <><B>Supabase</B> hosts our database and handles sign-in, including Google sign-in.</>,
                <><B>Vercel</B> hosts the website.</>,
                <><B>Resend</B> delivers our digest emails, so it receives your email address and the email content.</>,
                <><B>Google</B> provides the optional &ldquo;Sign in with Google&rdquo; feature.</>,
              ]}
            />
            <P>
              Our stories are drafted and checked with the help of AI services (Anthropic and Google). They receive the text of published news articles and our drafts. They do not receive your account details, email address or reading activity. Market prices shown on the site come from third-party data providers, which receive no information about you.
            </P>
            <P>
              These providers operate in several countries, including the United States, so your data may be processed outside the country where you live. We may also disclose information if the law requires it.
            </P>
          </Section>

          <Section title="Cookies">
            <P>
              We use essential cookies and similar browser storage to keep you signed in and remember simple preferences such as your theme. We don&apos;t use advertising or cross-site tracking cookies.
            </P>
          </Section>

          <Section title="How long we keep it">
            <List
              items={[
                "Account and saved-story data: until you ask us to delete your account.",
                "Digest email address: until you unsubscribe or ask us to remove it.",
                "Usage records: kept only as long as they are useful for understanding readership, and not linked to your identity.",
                "Feedback: for as long as we need it to act on it.",
              ]}
            />
          </Section>

          <Section title="Your choices and rights">
            <P>
              You can sign out at any time from your account page. Depending on where you live (for example under the EU/UK GDPR or India&apos;s Digital Personal Data Protection Act), you may have the right to access the data we hold about you, correct it, delete it, object to or limit how we use it, withdraw consent, and complain to your local data protection authority.
            </P>
            <P>
              To use any of these rights, to unsubscribe from the digest, or to delete your account, email <Mail /> from the address on your account and we will act on it promptly.
            </P>
          </Section>

          <Section title="Children">
            <P>
              Chanakya Lens is not directed at children under 13, and we don&apos;t knowingly collect their personal data. If you think a child has given us data, contact us and we will delete it.
            </P>
          </Section>

          <Section title="Changes to this policy">
            <P>
              We may update this policy as the site changes. The date at the top shows when it was last revised. Continued use after a change means you accept the updated policy.
            </P>
          </Section>

          <Section title="Contact">
            <P>Questions about this policy or your data? Email <Mail />.</P>
          </Section>
        </div>
      </article>
    </>
  );
}
