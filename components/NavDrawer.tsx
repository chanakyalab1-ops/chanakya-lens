"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "chanakya.lab1@gmail.com";
const REGIONS = ["Asia", "Americas", "Europe", "Middle East", "Africa"];

export default function NavDrawer() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [regionsOpen, setRegionsOpen] = useState(false);
  const regionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data.user?.email === ADMIN_EMAIL);
    });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (regionsRef.current && !regionsRef.current.contains(e.target as Node)) {
        setRegionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const linkClass = "font-mono text-[0.68rem] uppercase tracking-widest hover:opacity-60 transition-opacity";

  return (
    <header className="sticky top-0 z-20 border-b px-5 py-3 backdrop-blur"
      style={{ borderColor: "var(--border)", background: "rgba(10,17,42,0.95)" }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">

        {/* Left nav */}
        <nav className="flex items-center gap-5">
          <Link href="/" className={linkClass} style={{ color: "var(--text-on-ink-dim)" }}>Latest</Link>

          {/* Regions dropdown */}
          <div className="relative" ref={regionsRef}>
            <button
              onClick={() => setRegionsOpen(!regionsOpen)}
              className={linkClass + " flex items-center gap-1"}
              style={{ color: "var(--text-on-ink-dim)" }}
            >
              Regions
              <svg viewBox="0 0 10 6" fill="none" className="h-2 w-2 opacity-50">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {regionsOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-44 rounded-sm border shadow-xl py-1"
                style={{ background: "var(--ink-soft)", borderColor: "var(--border)" }}
              >
                <Link
                  href="/regions"
                  onClick={() => setRegionsOpen(false)}
                  className="block px-4 py-2 text-[0.78rem] hover:bg-white/5 font-mono uppercase tracking-wide"
                  style={{ color: "var(--brand-soft)" }}
                >
                  All regions
                </Link>
                <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />
                {REGIONS.map((r) => (
                  <Link
                    key={r}
                    href={`/regions?r=${encodeURIComponent(r)}`}
                    onClick={() => setRegionsOpen(false)}
                    className="block px-4 py-2 text-[0.78rem] hover:bg-white/5"
                    style={{ color: "var(--text-body)" }}
                  >
                    {r}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/off-lens" className={linkClass} style={{ color: "var(--text-on-ink-dim)" }}>Off-Lens</Link>
          <Link href="/digest" className={linkClass} style={{ color: "var(--text-on-ink-dim)" }}>Digest</Link>
          {isAdmin && (
            <Link href="/admin" className={linkClass} style={{ color: "var(--brand-soft)" }}>Admin</Link>
          )}
        </nav>

        {/* Center logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo-mark.png" alt="Chanakya Lens" width={40} height={40} className="rounded-full" />
          <span className="font-display text-xl font-extrabold uppercase tracking-wide hidden sm:block">
            Chanakya <span style={{ color: "var(--brand-soft)" }}>Lens</span>
          </span>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-4">
          <Link href="/about" className={linkClass} style={{ color: "var(--text-on-ink-dim)" }}>About</Link>
          <Link href="/account" className={linkClass} style={{ color: "var(--text-on-ink-dim)" }}>Account</Link>
        </div>

      </div>
    </header>
  );
}