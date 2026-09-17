"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "chanakya.lab1@gmail.com";
const REGIONS = ["Asia", "Americas", "Europe", "Middle East", "Africa"];

export default function NavDrawer() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
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

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus("loading");
    const { error } = await supabase.from("digest_signups").insert({ email: email.trim(), regions: [] });
    if (error && error.code !== "23505") { setSubStatus("error"); return; }
    setSubStatus("done");
  }

  return (
    <div ref={ref}>
      <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center border-b px-5 py-4 backdrop-blur"
        style={{ borderColor: "var(--border)", background: "rgba(10,17,42,0.95)" }}>
        <div className="w-8 justify-self-start" />
        <Link href="/" className="flex items-center gap-3 justify-self-center">
          <Image src="/logo-mark.png" alt="Chanakya Lens" width={40} height={40} className="rounded-full" />
          <span className="font-display text-2xl font-extrabold uppercase tracking-wide">
            Chanakya <span style={{ color: "var(--brand-soft)" }}>Lens</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 justify-self-end">
          <Link href="/account" className="font-mono text-[0.68rem] uppercase tracking-widest px-3 py-1.5 rounded-sm border hover:opacity-80" style={{ borderColor: "var(--border)", color: "var(--text-on-ink-dim)" }}>
            Account
          </Link>
          <button
            aria-label="Open menu"
            onClick={() => setOpen(!open)}
            className="flex flex-col gap-1 p-1.5"
          >
            <span className="h-px w-[18px]" style={{ background: "var(--text-on-ink)" }} />
            <span className="h-px w-[12px]" style={{ background: "var(--text-on-ink)" }} />
            <span className="h-px w-[18px]" style={{ background: "var(--text-on-ink)" }} />
          </button>
        </div>
      </header>

      {open && (
        <div
          className="fixed left-0 right-0 z-30 border-b shadow-2xl"
          style={{ top: "73px", background: "rgba(10,17,42,0.98)", borderColor: "var(--border)" }}
        >
          <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-5 gap-8">
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-4" style={{ color: "var(--brand-soft)" }}>Read</div>
              <div className="space-y-3">
                <Link href="/" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-on-ink)" }}>Latest stories</Link>
                <Link href="/off-lens" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-on-ink)" }}>Off-Lens</Link>
                <Link href="/digest" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-on-ink)" }}>Daily digest</Link>
              </div>
            </div>
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-4" style={{ color: "var(--brand-soft)" }}>Regions</div>
              <div className="space-y-3">
                <Link href="/regions" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-on-ink)" }}>All regions</Link>
                {REGIONS.map((r) => (
                  <Link key={r} href="/regions" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-body)" }}>{r}</Link>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-4" style={{ color: "var(--brand-soft)" }}>Follow</div>
              <div className="space-y-3">
                <a href="https://www.instagram.com/chanakya.lab/" target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-on-ink)" }}>Instagram</a>
                <a href="https://www.youtube.com/@Chanakya_lab" target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-on-ink)" }}>YouTube</a>
                <a href="https://www.facebook.com/share/1HntT8Xo6x/" target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-on-ink)" }}>Facebook</a>
              </div>
            </div>
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-4" style={{ color: "var(--brand-soft)" }}>About</div>
              <div className="space-y-3">
                <Link href="/about" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-on-ink)" }}>Our approach</Link>
                <Link href="/how-we-rate" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-on-ink)" }}>How we rate this</Link>
                <Link href="/feedback" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--text-on-ink)" }}>Feedback</Link>
                {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className="block text-sm hover:opacity-60" style={{ color: "var(--brand-soft)" }}>Admin</Link>}
              </div>
            </div>
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-4" style={{ color: "var(--brand-soft)" }}>Stay ahead</div>
              {subStatus === "done" ? (
                <p className="text-sm" style={{ color: "var(--brand-soft)" }}>You are on the list.</p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                  <p className="text-[0.78rem] mb-1" style={{ color: "var(--text-on-ink-dim)" }}>Daily geopolitics digest — free.</p>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="rounded-sm border px-3 py-1.5 text-sm outline-none w-full"
                    style={{ background: "var(--ink-card)", borderColor: "var(--border)", color: "var(--text-on-ink)" }}
                  />
                  <button
                    type="submit"
                    disabled={subStatus === "loading"}
                    className="rounded-sm px-4 py-1.5 text-sm font-semibold"
                    style={{ background: "var(--brand-soft)", color: "var(--ink)" }}
                  >
                    {subStatus === "loading" ? "..." : "Subscribe"}
                  </button>
                  {subStatus === "error" && <p className="text-xs" style={{ color: "var(--developing)" }}>Something went wrong.</p>}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}