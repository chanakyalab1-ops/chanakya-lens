import type { Metadata } from "next";
import Link from "next/link";
import NavDrawer from "@/components/NavDrawer";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  "/start-here",
  "Start here: how Chanakya Lens works",
  "Every story shows what happened, Chanakya's Move, how it could affect you, and who is covering it. A two-minute guide."
);

const PARTS = [
  { name: "What happened", text: "The facts, stated plainly and sourced." },
  { name: "Chanakya's Move", text: "Whose move this was, what they are betting on, and what could counter it." },
  { name: "How could this affect you", text: "The chain from the headline to your life, with each link rated Direct, Likely or Possible." },
  { name: "Off-Lens", text: "Which countries are covering the story, and which perspectives are missing from the sources we found." },
];

const PLACES = [
  { href: "/today", name: "Today's Signal", text: "What moved most in the last day." },
  { href: "/regions", name: "Regions", text: "Browse stories by part of the world." },
  { href: "/off-lens", name: "Off-Lens", text: "How different countries cover the same news." },
  { href: "/lens", name: "The Lens", text: "The places, powers and supply chains behind the news." },
  { href: "/digest", name: "Daily digest", text: "One email a day, tuned to your topics. Free." },
  { href: "/how-we-rate", name: "How we rate", text: "What Direct, Likely and Possible mean." },
];

export default function StartHerePage() {
  return (
    <>
      <NavDrawer />
      <main className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>Start here</div>
        <h1 className="font-display font-bold text-3xl leading-tight mb-3">Geopolitics, traced to what it means for you</h1>
        <p className="text-[0.95rem] leading-relaxed mb-8" style={{ color: "var(--text-body)" }}>
          Most news tells you what happened. Chanakya Lens follows the chain from the headline to the place it reaches you, and shows who else is telling the story.
        </p>

        <h2 className="font-display font-bold uppercase tracking-wide text-lg mb-3" style={{ color: "var(--brand-soft)" }}>Every story has four parts</h2>
        <div className="space-y-3 mb-9">
          {PARTS.map((p, i) => (
            <div key={p.name} className="flex gap-3 p-3.5 border rounded-sm" style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}>
              <div className="font-display font-bold text-2xl" style={{ color: "var(--brand-soft)" }}>{i + 1}</div>
              <div>
                <div className="font-display font-bold text-lg leading-tight">{p.name}</div>
                <div className="text-[0.9rem]" style={{ color: "var(--text-body)" }}>{p.text}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[0.85rem] mb-9" style={{ color: "var(--text-on-ink-dim)" }}>
          Not every story gets all four. We only add impact and strategy when there is a real chain to trace.
        </p>

        <h2 className="font-display font-bold uppercase tracking-wide text-lg mb-3" style={{ color: "var(--brand-soft)" }}>Where to go</h2>
        <div className="grid gap-3 sm:grid-cols-2 mb-9">
          {PLACES.map((p) => (
            <Link key={p.href} href={p.href} className="block p-3.5 border rounded-sm hover:opacity-80" style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}>
              <div className="font-display font-bold text-lg leading-tight">{p.name}</div>
              <div className="text-[0.85rem]" style={{ color: "var(--text-body)" }}>{p.text}</div>
            </Link>
          ))}
        </div>

        <h2 className="font-display font-bold uppercase tracking-wide text-lg mb-3" style={{ color: "var(--brand-soft)" }}>Keep it close</h2>
        <p className="text-[0.92rem] leading-relaxed mb-6" style={{ color: "var(--text-body)" }}>
          Get the <Link href="/digest" className="underline">daily digest</Link> in your inbox, or add the site to your phone&apos;s home screen from your browser&apos;s share or menu button. See <Link href="/features" className="underline">every feature</Link>, or <Link href="/whats-new" className="underline">what&apos;s new</Link> for the latest changes.
        </p>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-sm text-sm font-semibold text-white" style={{ background: "#0E7080", color: "#fff" }}>Read today&apos;s stories</Link>
      </main>
    </>
  );
}
