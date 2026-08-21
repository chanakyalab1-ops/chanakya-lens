"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DigestSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    const { error } = await supabase.from("digest_signups").insert({ email: email.trim() });

    if (error) {
      if (error.code === "23505") {
        setStatus("done");
      } else {
        setStatus("error");
      }
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="text-sm" style={{ color: "var(--brand-soft)" }}>
        You are on the list — we will email you when it launches.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 rounded-full border px-4 py-2 text-sm outline-none"
        style={{ background: "var(--ink-card)", borderColor: "var(--border)", color: "var(--text-on-ink)" }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full px-5 py-2 text-sm font-semibold"
        style={{ background: "var(--brand-soft)", color: "var(--ink)" }}
      >
        {status === "loading" ? "..." : "Notify me"}
      </button>
      {status === "error" && (
        <p className="text-xs mt-1 sm:mt-0 sm:ml-2" style={{ color: "var(--developing)" }}>
          Something went wrong — try again.
        </p>
      )}
    </form>
  );
}