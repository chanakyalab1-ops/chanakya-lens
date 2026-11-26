'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const KEY = 'cl_getstarted_closed';

// A short checklist on the homepage for readers who have just signed up, so they find the
// tools without hunting. It disappears when the steps are done or when it is closed.
export default function GetStartedCard() {
  const [state, setState] = useState<{ watching: number; saved: number } | null>(null);

  useEffect(() => {
    let off = false;
    try {
      if (window.localStorage.getItem(KEY)) return;
    } catch {
      // storage unavailable
    }
    if (!/(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) return;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { enabled?: boolean; interests?: unknown[]; shelf?: unknown[] }) => {
        if (off || !d.enabled) return;
        setState({ watching: d.interests?.length ?? 0, saved: d.shelf?.length ?? 0 });
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  if (!state || (state.watching > 0 && state.saved > 0)) return null;

  const steps = [
    { done: state.watching > 0, text: 'Pick what you follow', hint: 'Countries, places and topics build your My Lens tab.', href: '/account/watchlist' },
    { done: state.saved > 0, text: 'Save a story', hint: 'Tap Save at the top of any story to keep it for later.', href: '#' },
  ];
  const done = steps.filter((s) => s.done).length;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-3">
      <div className="rounded-sm border p-4 flex flex-wrap items-start justify-between gap-4" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
        <div>
          <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-soft)' }}>Get started · {done} of {steps.length}</div>
          <ul className="space-y-1.5">
            {steps.map((s) => (
              <li key={s.text} className="flex items-center gap-2.5 text-[0.9rem]">
                <span className="h-4 w-4 shrink-0 rounded-full border flex items-center justify-center text-[0.65rem]" style={s.done ? { background: '#0E7080', borderColor: '#0E7080', color: '#fff' } : { borderColor: 'var(--border)' }}>{s.done ? '✓' : ''}</span>
                {s.done || s.href === '#' ? (
                  <span style={s.done ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>{s.text}<span className="text-[0.78rem]" style={{ color: 'var(--text-on-ink-dim)' }}> · {s.hint}</span></span>
                ) : (
                  <Link href={s.href} className="underline" style={{ color: 'var(--text-on-ink)' }}>{s.text}<span className="no-underline text-[0.78rem]" style={{ color: 'var(--text-on-ink-dim)' }}> · {s.hint}</span></Link>
                )}
              </li>
            ))}
          </ul>
          <Link href="/tools" className="inline-block mt-3 font-mono text-[0.6875rem] uppercase tracking-wide underline" style={{ color: 'var(--brand-soft)' }}>See everything you can do</Link>
        </div>
        <button
          aria-label="Close"
          onClick={() => {
            setState(null);
            try {
              window.localStorage.setItem(KEY, '1');
            } catch {
              // fine without it
            }
          }}
          className="text-lg leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
