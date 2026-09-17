"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "chanakya.lab1@gmail.com";

export default function NavDrawer() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data.user?.email === ADMIN_EMAIL);
    });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center border-b px-5 py-4 backdrop-blur"
      style={{ borderColor: "var(--border)", background: "rgba(10,17,42,0.92)" }}>
      <div className="relative justify-self-start" ref={ref}>
        <button
          aria-label="Open menu"
          onClick={() => setOpen(!open)}
          className="flex flex-col gap-1 p-1.5"
        >
          <span className="h-px w-[18px]" style={{ background: "var(--text-on-ink)" }} />
          <span className="h-px w-[12px]" style={{ background: "var(--text-on-ink)" }} />
          <span className="h-px w-[18px]" style={{ background: "var(--text-on-ink)" }} />
        </button>

        {open && (
          <nav
            className="absolute top-full left-0 mt-2 w-56 rounded-sm border shadow-xl z-50"
            style={{ background: "var(--ink-soft)", borderColor: "var(--border)" }}
          >
            {isAdmin && (
              <>
                <div className="font-mono text-[0.6rem] uppercase tracking-widest px-4 pt-3 pb-1" style={{ color: "var(--brand-soft)" }}>Admin</div>
                <Link href="/admin" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-white/5" style={{ color: "var(--brand-soft)" }}>Dashboard</Link>
              </>
            )}
            <div className="font-mono text-[0.6rem] uppercase tracking-widest px-4 pt-3 pb-1" style={{ color: "var(--text-on-ink-dim)" }}>Read</div>
            <Link href="/" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-white/5">Latest stories</Link>
            <Link href="/regions" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-white/5">Browse by region</Link>
            <Link href="/off-lens" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-white/5">Off-Lens</Link>
            <div className="font-mono text-[0.6rem] uppercase tracking-widest px-4 pt-3 pb-1" style={{ color: "var(--text-on-ink-dim)" }}>Follow</div>
            <a href="https://www.instagram.com/chanakya.lab/" target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm hover:bg-white/5">Instagram</a>
            <a href="https://www.youtube.com/@Chanakya_lab" target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm hover:bg-white/5">YouTube</a>
            <a href="https://www.facebook.com/share/1HntT8Xo6x/" target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm hover:bg-white/5">Facebook</a>
            <Link href="/digest" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-white/5">Daily digest</Link>
            <div className="font-mono text-[0.6rem] uppercase tracking-widest px-4 pt-3 pb-1" style={{ color: "var(--text-on-ink-dim)" }}>About</div>
            <Link href="/how-we-rate" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-white/5">How we rate this</Link>
            <Link href="/about" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-white/5">Our approach</Link>
            <Link href="/feedback" onClick={() => setOpen(false)} className="block px-4 py-2 pb-3 text-sm hover:bg-white/5">Feedback</Link>
          </nav>
        )}
      </div>

      <Link href="/" className="flex items-center gap-3 justify-self-center">
        <Image src="/logo-mark.png" alt="Chanakya Lens" width={56} height={56} className="rounded-full" />
        <span className="font-display text-2xl font-extrabold uppercase tracking-wide">
          Chanakya <span style={{ color: "var(--brand-soft)" }}>Lens</span>
        </span>
      </Link>

      <div className="flex items-center justify-self-end">
        <Link href="/account" className="font-mono text-[0.68rem] uppercase tracking-widest px-3 py-1.5 rounded-sm border hover:opacity-80" style={{ borderColor: "var(--border)", color: "var(--text-on-ink-dim)" }}>
          Account
        </Link>
      </div>
    </header>
  );
}