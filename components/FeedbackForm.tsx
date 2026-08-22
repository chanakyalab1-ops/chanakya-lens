"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FeedbackForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("loading");

    const { error } = await supabase.from("feedback_submissions").insert({
      email: email.trim() || null,
      message: message.trim(),
    });

    if (error) {
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="text-sm" style={{ color: "var(--brand-soft)" }}>
        Thanks -- we got it.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-3 text-left">
      <div>
        <label className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-on-ink-dim)" }}>
          Email (optional)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
          style={{ background: "var(--ink-card)", borderColor: "var(--border)", color: "var(--text-on-ink)" }}
        />
      </div>

      <div>
        <label className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-on-ink-dim)" }}>
          Message
        </label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Tell us anything."
          className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none resize-none"
          style={{ background: "var(--ink-card)", borderColor: "var(--border)", color: "var(--text-on-ink)" }}
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-2 rounded-sm font-medium disabled:opacity-40"
        style={{ background: "var(--brand-soft)", color: "var(--ink)" }}
      >
        {status === "loading" ? "Sending..." : "Send feedback"}
      </button>

      {status === "error" && (
        <p className="text-xs text-center" style={{ color: "var(--developing)" }}>
          Something went wrong -- try again.
        </p>
      )}
    </form>
  );
}