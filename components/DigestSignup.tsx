"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const REGIONS = ["Asia", "Americas", "Europe", "Middle East", "Africa"];

export default function DigestSignup() {
  const [email, setEmail] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  function toggleRegion(region: string) {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    const { error } = await supabase.from("digest_signups").insert({
      email: email.trim(),
      regions: selectedRegions,
    });
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
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {REGIONS.map((region) => (
          <button
            type="button"
            key={region}
            onClick={() => toggleRegion(region)}
            className="font-mono text-[0.66rem] uppercase tracking-wide rounded-full border px-3 py-1.5 transition-colors"
            style={
              selectedRegions.includes(region)
                ? { color: "var(--ink)", background: "var(--brand-soft)", borderColor: "var(--brand-soft)" }
                : { color: "var(--text-on-ink)", borderColor: "rgba(255,255,255,0.18)", background: "transparent" }
            }
          >
            {region}
          </button>
        ))}
      </div>
      <p className="text-[0.72rem] text-center" style={{ color: "var(--text-on-ink-dim)" }}>
        {selectedRegions.length === 0 ? "No selection = all regions" : `${selectedRegions.length} selected`}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
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
      </div>
      {status === "error" && (
        <p className="text-xs text-center" style={{ color: "var(--developing)" }}>
          Something went wrong — try again.
        </p>
      )}
    </form>
  );
}
