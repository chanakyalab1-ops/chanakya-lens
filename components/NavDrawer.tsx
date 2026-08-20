"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function NavDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center border-b px-5 py-4 backdrop-blur"
        style={{ borderColor: "var(--border)", background: "rgba(10,17,42,0.92)" }}>
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="flex flex-col gap-1 p-1.5 justify-self-start"
        >
          <span className="h-px w-[18px]" style={{ background: "var(--text-on-ink)" }} />
          <span className="h-px w-[12px]" style={{ background: "var(--text-on-ink)" }} />
          <span className="h-px w-[18px]" style={{ background: "var(--text-on-ink)" }} />
        </button>

        <Link href="/" className="flex items-center gap-3 justify-self-center">
          <Image src="/logo-mark.png" alt="Chanakya Lens" width={44} height={44} className="rounded-full" />
          <span className="font-display text-2xl font-extrabold uppercase tracking-wide">
            Chanakya <span style={{ color: "var(--brand-soft)" }}>Lens</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 justify-self-end">
          <div className="h-9 w-9 rounded-full border flex items-center justify-center" style={{ borderColor: "var(--border)" }}>
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 opacity-80">
              <circle cx="8" cy="8" r="7" stroke="var(--text-on-ink)" strokeWidth="1.2" />
              <path d="M8 4v4l2.5 2.5" stroke="var(--text-on-ink)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <Link href="/account" className="h-9 w-9 rounded-full border flex items-center justify-center" style={{ borderColor: "var(--border)" }}>
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 opacity-80">
              <circle cx="8" cy="6" r="3" stroke="var(--text-on-ink)" strokeWidth="1.2" />
              <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="var(--text-on-ink)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Scrim */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(10,13,17,0.6)" }}
      />

      {/* Drawer */}
      <nav
        className={`fixed top-0 left-0 bottom-0 z-40 w-[250px] border-r py-5 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--ink-soft)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between border-b px-5 pb-4 mb-1.5" style={{ borderColor: "var(--border)" }}>
          <div className="font-display text-base font-extrabold uppercase tracking-wide">
            Chanakya <span style={{ color: "var(--brand-soft)" }}>Lens</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ color: "var(--text-on-ink-dim)" }}>
            ✕
          </button>
        </div>

        <div className="font-mono text-[0.6rem] uppercase tracking-widest px-5 pt-3.5 pb-1.5" style={{ color: "var(--text-on-ink-dim)" }}>Read</div>
        <Link href="/" className="px-5 py-2.5 text-sm hover:bg-white/5">Latest stories</Link>
        <Link href="/videos" className="px-5 py-2.5 text-sm hover:bg-white/5">Video briefs</Link>
        <Link href="/regions" className="px-5 py-2.5 text-sm hover:bg-white/5 flex justify-between">
          Browse by region <span className="font-mono text-[0.68rem]" style={{ color: "var(--text-on-ink-dim)" }}>soon</span>
        </Link>

        <div className="font-mono text-[0.6rem] uppercase tracking-widest px-5 pt-3.5 pb-1.5" style={{ color: "var(--text-on-ink-dim)" }}>Follow</div>
        <a href="https://instagram.com" target="_blank" className="px-5 py-2.5 text-sm hover:bg-white/5 flex items-center justify-between">
          Latest posts
          <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5 opacity-50">
            <path d="M2 10 10 2M10 2H4M10 2v6" stroke="var(--text-on-ink-dim)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <Link href="/digest" className="px-5 py-2.5 text-sm hover:bg-white/5 flex justify-between">
          Weekly digest <span className="font-mono text-[0.68rem]" style={{ color: "var(--text-on-ink-dim)" }}>email</span>
        </Link>

        <div className="font-mono text-[0.6rem] uppercase tracking-widest px-5 pt-3.5 pb-1.5" style={{ color: "var(--text-on-ink-dim)" }}>About</div>
        <Link href="/how-we-rate" className="px-5 py-2.5 text-sm hover:bg-white/5">How we rate this</Link>
        <Link href="/about" className="px-5 py-2.5 text-sm hover:bg-white/5">Our approach</Link>

        <div className="font-mono text-[0.6rem] uppercase tracking-widest px-5 pt-3.5 pb-1.5" style={{ color: "var(--text-on-ink-dim)" }}>Off-Lens</div>
        <Link href="/off-lens" className="px-5 py-2.5 text-sm hover:bg-white/5">What is Off-Lens</Link>
      </nav>

    </>
  );
}