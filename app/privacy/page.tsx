import NavDrawer from "@/components/NavDrawer";
import Link from "next/link";

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

        <div className="font-mono text-[0.68rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>
          Legal
        </div>

        <h1 className="font-display font-bold text-3xl leading-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-[0.8rem] mb-8" style={{ color: "var(--text-on-ink-dim)" }}>
          Last updated August 2026
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              What we collect
            </h2>
            <p className="text-[0.9rem] leading-relaxed mb-3" style={{ color: "var(--text-body)" }}>
              If you create an account, we collect your email address and, if you sign up with a password, a securely hashed version of it -- we never see or store your password in plain text.
            </p>
            <p className="text-[0.9rem] leading-relaxed mb-3" style={{ color: "var(--text-body)" }}>
              If you sign in with Google, we receive your name, email address, and profile photo from Google -- nothing more, and we never post on your behalf or access your other Google data.
            </p>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              If you save a story to your account or sign up for the weekly digest, we store that preference against your account so we can show it back to you.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              What we don't do
            </h2>
            <ul className="space-y-2">
              <li className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                We don't sell your data to anyone.
              </li>
              <li className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                We don't run third-party advertising or ad-tracking scripts on this site.
              </li>
              <li className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                We don't share your account data with anyone outside the infrastructure providers listed below.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              Who we share data with
            </h2>
            <p className="text-[0.9rem] leading-relaxed mb-3" style={{ color: "var(--text-body)" }}>
              We use a small number of infrastructure providers to run this site, and your account data passes through them as part of normal operation:
            </p>
            <ul className="space-y-2">
              <li className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                <strong style={{ color: "var(--text-on-ink)" }}>Supabase</strong> -- hosts our database and handles authentication (including Google sign-in).
              </li>
              <li className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                <strong style={{ color: "var(--text-on-ink)" }}>Google</strong> -- provides the "Sign in with Google" option, if you choose to use it.
              </li>
              <li className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
                <strong style={{ color: "var(--text-on-ink)" }}>Vercel</strong> -- hosts the website itself.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              Cookies
            </h2>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              We use essential cookies to keep you signed in between visits. We don't use advertising or cross-site tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              Your choices
            </h2>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              You can sign out at any time from your account page. To delete your account or the data associated with it, contact us using the email below and we'll take care of it.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
              Contact
            </h2>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-body)" }}>
              Questions about this policy or your data? Reach us at{" "}
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