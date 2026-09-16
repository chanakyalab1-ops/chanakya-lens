"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      setIsDark(false);
    }
  }, []);

  function toggle() {
    const next = isDark ? "light" : "dark";
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", next);
    setIsDark(!isDark);
  }

  return (
    <button
      onClick={toggle}
      className="font-mono text-[0.68rem] uppercase tracking-widest px-3 py-1.5 rounded-sm border hover:opacity-80"
      style={{ borderColor: "var(--border)", color: "var(--text-on-ink-dim)" }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}