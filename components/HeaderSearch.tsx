"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Global search lives in the header now (was previously a row under the
// homepage feed). It writes the query to the `q` URL param on `/` --
// Feed.tsx reads that reactively via its own useSearchParams() to filter.
// On any other page, submitting navigates to `/?q=...`.
function useHeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  // Re-sync the input if the URL's `q` changes from outside this component
  // (e.g. back/forward navigation) -- adjusted during render rather than in
  // an effect, per React's guidance for resetting state from a changed prop.
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setValue(urlQuery);
  }
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function navigate(next: string) {
    const trimmed = next.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/", { scroll: false });
  }

  function onChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(next), 300);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(value);
  }

  return { value, onChange, onSubmit };
}

function SearchIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={style}>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function HeaderSearchDesktop() {
  const { value, onChange, onSubmit } = useHeaderSearch();
  return (
    <form onSubmit={onSubmit} className="relative w-[220px]">
      <SearchIcon style={{ color: "var(--text-on-ink-dim)", position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search stories..."
        className="w-full rounded-full border pl-8 pr-3 py-1.5 text-sm outline-none"
        style={{ background: "var(--ink-card)", borderColor: "var(--border)", color: "var(--text-on-ink)" }}
      />
    </form>
  );
}

export function HeaderSearchMobile() {
  const [open, setOpen] = useState(false);
  const { value, onChange, onSubmit } = useHeaderSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center h-7 w-7"
        style={{ color: "var(--text-on-ink)" }}
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="fixed left-0 right-0 top-0 z-40 flex items-center gap-2 border-b px-4 py-3" style={{ background: "var(--overlay)", borderColor: "var(--border)" }}>
      <SearchIcon style={{ color: "var(--text-on-ink-dim)" }} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search stories..."
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: "var(--text-on-ink)" }}
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close search"
        className="text-sm px-1"
        style={{ color: "var(--text-on-ink-dim)" }}
      >
        ✕
      </button>
    </form>
  );
}
