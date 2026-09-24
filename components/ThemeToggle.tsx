"use client";
import { useSyncExternalStore } from "react";

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"){document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`;

function subscribe(callback: () => void) {
  window.addEventListener("themechange", callback);
  return () => window.removeEventListener("themechange", callback);
}

function getSnapshot(): "dark" | "light" {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function getServerSnapshot(): "dark" | "light" {
  return "dark";
}

function SunIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} style={style} width="10" height="10">
      <circle cx="8" cy="8" r="3" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M8 0.5v2M8 13.5v2M15.5 8h-2M2.5 8h-2M13.4 2.6l-1.4 1.4M4 12l-1.4 1.4M13.4 13.4l-1.4-1.4M4 4L2.6 2.6" />
      </g>
    </svg>
  );
}

function MoonIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} style={style} width="10" height="10">
      <path d="M14 9.2A6.5 6.5 0 0 1 6.8 2 6.5 6.5 0 1 0 14 9.2Z" fill="currentColor" />
    </svg>
  );
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLight = theme === "light";

  function toggle() {
    const next = isLight ? "dark" : "light";
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("theme", next);
    } catch {}
    window.dispatchEvent(new Event("themechange"));
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      onClick={toggle}
      suppressHydrationWarning
      className="relative inline-flex h-6 w-[42px] shrink-0 items-center rounded-full border transition-colors hover:opacity-90"
      style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}
    >
      <SunIcon className="absolute left-[5px] transition-opacity" style={{ color: "var(--text-on-ink-dim)", opacity: isLight ? 0.35 : 1 }} />
      <MoonIcon className="absolute right-[5px] transition-opacity" style={{ color: "var(--text-on-ink-dim)", opacity: isLight ? 1 : 0.35 }} />
      <span
        className="inline-block h-[18px] w-[18px] rounded-full transition-transform"
        style={{
          background: "var(--brand-soft)",
          transform: isLight ? "translateX(22px)" : "translateX(3px)",
        }}
      />
    </button>
  );
}
