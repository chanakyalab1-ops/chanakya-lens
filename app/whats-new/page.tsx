import type { Metadata } from "next";
import Link from "next/link";
import NavDrawer from "@/components/NavDrawer";
import { sortedWhatsNew } from "@/lib/whatsNew";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("/whats-new", "What's new | Chanakya Lens", "New features and changes on Chanakya Lens, newest first.");

export default function WhatsNewPage() {
  const entries = sortedWhatsNew();
  return (
    <>
      <NavDrawer />
      <main className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <div className="font-mono text-[0.68rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>Updates</div>
        <h1 className="font-display font-bold text-3xl leading-tight mb-3">What&apos;s new</h1>
        <p className="text-[0.95rem] leading-relaxed mb-8" style={{ color: "var(--text-body)" }}>
          New features and changes, newest first. New here? <Link href="/start-here" className="underline">Start here</Link>.
        </p>
        <div className="space-y-5">
          {entries.map((e) => (
            <article key={`${e.date}-${e.title}`} className="border-l-2 pl-4" style={{ borderColor: "var(--brand)" }}>
              <time dateTime={e.date} className="font-mono text-[0.65rem] uppercase tracking-wide" style={{ color: "var(--text-on-ink-dim)" }}>
                {new Date(`${e.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
              </time>
              <h2 className="font-display font-bold text-xl mt-1 mb-1.5">{e.title}</h2>
              <p className="text-[0.92rem] leading-relaxed" style={{ color: "var(--text-body)" }}>{e.body}</p>
              {e.href && (
                <Link href={e.href} className="inline-block mt-2 text-[0.85rem] underline" style={{ color: "var(--brand-soft)" }}>
                  {e.linkLabel ?? "Learn more"} →
                </Link>
              )}
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
