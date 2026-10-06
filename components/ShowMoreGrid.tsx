"use client";
import { Children, useState, type ReactNode } from "react";

// Shows the first `initial` items and reveals the rest on request. Every item
// is still in the page HTML (just hidden), so the links stay crawlable.
export function ShowMoreGrid({ initial = 12, step = 24, className, children }: { initial?: number; step?: number; className?: string; children: ReactNode }) {
  const items = Children.toArray(children);
  const [shown, setShown] = useState(initial);
  return (
    <>
      <div className={className}>
        {items.map((item, i) => (
          <div key={i} className={i >= shown ? "hidden" : "contents"}>
            {item}
          </div>
        ))}
      </div>
      {shown < items.length && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + step)}
            className="font-mono text-[0.72rem] uppercase tracking-wide rounded-full border px-5 py-2.5 hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text-on-ink)" }}
          >
            Show more ({items.length - shown} left)
          </button>
        </div>
      )}
    </>
  );
}
