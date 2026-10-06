import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import NavDrawer from "@/components/NavDrawer";
import DigestSignup from "@/components/DigestSignup";

export const metadata: Metadata = pageMeta("/digest", "The Chanakya Lens daily digest: geopolitics by email", "A daily email on what mattered in geopolitics today, traced by topic. Pick your topics and get the signal, not the noise.");

export default function DigestPage() {
  return (
    <>
      <NavDrawer />
      <div className="max-w-2xl mx-auto px-5 pt-12 pb-16 text-center">
        <div className="font-mono text-[0.64rem] uppercase tracking-widest mb-3" style={{ color: "var(--text-on-ink-dim)" }}>
          Live
        </div>
        <h1 className="font-display font-bold text-2xl mb-4">Daily digest</h1>
        <p className="text-[0.9rem] leading-relaxed mb-8" style={{ color: "var(--text-body)" }}>
          A daily email covering what mattered today, traced by topic — pick the topics you care about and we will send the signal, not the noise.
        </p>
        <DigestSignup />
      </div>
    </>
  );
}

