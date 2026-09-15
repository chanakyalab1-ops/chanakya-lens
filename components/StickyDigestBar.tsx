"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StickyDigestBar() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [dismissed, setDismissed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    const { error } = await supabase.from("digest_signups").insert({
      email: email.trim(),
      regions: [],
    });
    if (error && error.code !== "23505") {
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (dismissed) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-3 flex items-center justify-between gap-4"
      style={{ background: "rgba(10,17,42,0.97)", borderColor: "var(--border)", backdropFilter: "blur(8px)" }}
    >
      {status === "done" ? (
        <div className="flex items-center justify-between w-full">
          <p className="text-sm font-mono" style={{ color: "var(--brand-soft)" }}>
            You are on the list — first digest lands tomorrow morning.
          </p>
          <button onClick={() => setDismissed(true)} className="text-[0.7rem] font-mono hover:opacity-80" style={{ color: "var(--text-on-ink-dim)" }}>
            Dismiss
          </button>
        </div>
      ) : (
        <>
          <div className="hidden sm:block shrink-0">
            <p className="font-mono text-[0.68rem] uppercase tracking-widest" style={{ color: "var(--brand-soft)" }}>
              Stay ahead of the map.
            </p>
            <p className="text-[0.72rem]" style={{ color: "var(--text-on-ink-dim)" }}>
              Daily geopolitics digest — free.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-1 gap-2 max-w-md">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-sm border px-3 py-1.5 text-sm outline-none"
              style={{ background: "var(--ink-card)", borderColor: "var(--border)", color: "var(--text-on-ink)" }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-sm px-4 py-1.5 text-sm font-semibold shrink-0"
              style={{ background: "var(--brand-soft)", color: "var(--ink)" }}
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
          <button onClick={() => setDismissed(true)} className="text-[0.7rem] font-mono hover:opacity-80 shrink-0" style={{ color: "var(--text-on-ink-dim)" }}>
            X
          </button>
        </>
      )}
    </div>
  );
}