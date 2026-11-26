import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: "var(--border)", background: "var(--ink-soft)" }}>
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="font-display font-extrabold text-lg uppercase tracking-wide mb-4">
              Chanakya <span style={{ color: "var(--brand-soft)" }}>Lens</span>
            </div>
            <p className="text-[0.82rem] leading-relaxed" style={{ color: "var(--text-on-ink-dim)" }}>
              Global moves. Local math. Geopolitics through the Kautilyan lens.
            </p>
          </div>
          <div>
            <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>Read</div>
            <div className="space-y-2">
              <Link prefetch={false} href="/" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Latest stories</Link>
              <Link prefetch={false} href="/regions" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Browse by region</Link>
              <Link href="/off-lens" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Off-Lens</Link>
              <Link href="/lens" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>The Lens</Link>
              {process.env.MEMBERSHIP_PUBLIC === "true" && <Link href="/monthly" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Lens Monthly</Link>}
              <Link href="/digest" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Daily digest</Link>
              <Link href="/membership" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Lens+ {process.env.MEMBERSHIP_PUBLIC === "true" ? "membership" : "waitlist"}</Link>
            </div>
          </div>
          <div>
            <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>About</div>
            <div className="space-y-2">
              <Link href="/start-here" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Start here</Link>
              <Link href="/about" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Our approach</Link>
              <Link href="/whats-new" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>What&apos;s new</Link>
              <Link href="/how-we-rate" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>How we rate this</Link>
              <Link href="/creators" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Creator partners</Link>
              <Link href="/feedback" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Feedback</Link>
              <Link href="/privacy" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Privacy policy</Link>
              <Link href="/refund" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Refund policy</Link>
              <Link href="/terms" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Terms of service</Link>
              <a href="mailto:chanakya.lab1@gmail.com" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Contact</a>
            </div>
          </div>
          <div>
            <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>Follow</div>
            <div className="space-y-2">
              <a href="https://www.instagram.com/chanakya.lab/" target="_blank" rel="noreferrer" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Instagram</a>
              <a href="https://www.youtube.com/@Chanakya_lab" target="_blank" rel="noreferrer" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>YouTube</a>
              <a href="https://www.facebook.com/share/1HntT8Xo6x/" target="_blank" rel="noreferrer" className="block text-sm hover:opacity-80" style={{ color: "var(--text-body)" }}>Facebook</a>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <span className="font-mono text-[0.6875rem]" style={{ color: "var(--text-on-ink-dim)" }}>
            © 2026 Chanakya Lens. All rights reserved.
          </span>
          <span className="font-mono text-[0.6875rem]" style={{ color: "var(--text-on-ink-dim)" }}>
            Market prices are indicative only. Not investment advice.
          </span>
        </div>
      </div>
    </footer>
  );
}