'use client';

import { useEffect, useState, useTransition } from 'react';
import { toggleWatch } from '@/app/account/watchActions';

// "Watch this story": an alert on this device when it is updated. Story pages are
// cached for everyone, so this is asked in the browser; hidden for everyone but the owner
// until MEMBERSHIP_PUBLIC=true.
export function WatchButton({ slug, open, compact }: { slug: string; open?: boolean; compact?: boolean }) {
  const [show, setShow] = useState(false);
  const [locked, setLocked] = useState(false);
  const [watching, setWatching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!/(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) {
      // Once membership is public, visitors see the tool as a Lens+ feature.
      if (open) setTimeout(() => { setLocked(true); setShow(true); }, 0);
      return;
    }
    let off = false;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { enabled?: boolean; watching?: string[]; paid?: string }) => {
        if (off) return;
        if (!d.enabled) {
          if (open) { setLocked(true); setShow(true); }
          return;
        }
        setLocked(d.paid === 'locked');
        setWatching((d.watching ?? []).includes(slug));
        setShow(true);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [slug, open]);

  if (!show) return null;
  if (locked) {
    return (
      <a href="/membership" title="Watching a story is for Lens+ members" aria-label="Watch this story" className={`inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80 ${compact ? 'justify-center w-9 h-9' : ''}`} style={{ color: 'var(--text-on-ink-dim)' }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
        {!compact && 'Watch · Lens+'}
      </a>
    );
  }
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        disabled={pending}
        aria-pressed={watching}
        onClick={() =>
          start(async () => {
            const r = await toggleWatch(slug);
            if (r.ok) {
              setWatching(r.watching);
              setMsg(r.watching ? 'You will get an alert when this story is updated. Turn on the bell if you have not.' : null);
              if (r.watching) setTimeout(() => setMsg(null), 5000);
            } else setMsg(r.error);
          })
        }
        aria-label={watching ? 'Stop watching this story' : 'Watch this story'}
        className={`inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80 disabled:opacity-60 ${compact ? 'justify-center w-9 h-9' : ''}`}
        style={{ color: watching ? 'var(--brand-soft)' : 'var(--text-on-ink-dim)' }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={watching ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" fill={watching ? 'var(--ink)' : 'none'} /></svg>
        {!compact && (watching ? 'Watching' : 'Watch')}
      </button>
      {msg && (
        <span className="absolute right-0 top-full mt-2 z-20 w-60 border p-3 text-[0.72rem] normal-case tracking-normal font-sans" style={{ background: 'var(--ink-card)', borderColor: 'var(--border)', color: 'var(--text-body)' }}>
          {msg}
        </span>
      )}
    </span>
  );
}
