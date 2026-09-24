"use client";
import { useSyncExternalStore } from "react";
import { subscribeTheme, setThemePreference, getStoredPreference, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

function getServerSnapshot(): ThemePreference {
  return "auto";
}

// Desktop-only. Mobile keeps the sliding switch (ThemeToggle) and never
// exposes "auto" directly -- this is the only place a user can pick it.
export default function ThemeSegmentedControl({ className }: { className?: string }) {
  const pref = useSyncExternalStore(subscribeTheme, getStoredPreference, getServerSnapshot);

  return (
    <div className={`flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-wide ${className ?? ""}`}>
      <span style={{ color: "var(--text-on-ink-dim)" }}>Theme:</span>
      {OPTIONS.map((opt, i) => (
        <span key={opt.value} className="flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={pref === opt.value}
            onClick={() => setThemePreference(opt.value)}
            className="hover:opacity-80"
            style={{ color: pref === opt.value ? "var(--brand-soft)" : "var(--text-on-ink-dim)" }}
          >
            {opt.label}
          </button>
          {i < OPTIONS.length - 1 && (
            <span aria-hidden style={{ color: "var(--border)" }}>|</span>
          )}
        </span>
      ))}
    </div>
  );
}
