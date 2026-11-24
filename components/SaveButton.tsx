'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { toggleSaved } from '@/app/account/saved/actions';

// Keeps a saved story's page on this device so it opens without a connection.
function keepOffline(slug: string) {
  try {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    if ('caches' in window) caches.open('cl-stories-v1').then((c) => c.add(`/story/${slug}`)).catch(() => {});
  } catch {
    // offline copy is a bonus
  }
}

// Save a story to read later. The story page is cached for everyone, so whether
// it is already kept is asked for in the browser, and only when a session cookie exists.
export function SaveButton({ slug, compact, open }: { slug: string; compact?: boolean; open: boolean }) {
  const [state, setState] = useState<'loading' | 'anon' | 'ready' | 'off'>('loading');
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let off = false;
    const hasSession = /(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie);
    if (!hasSession) {
      setTimeout(() => !off && setState(open ? 'anon' : 'off'), 0);
      return;
    }
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { signedIn: boolean; enabled: boolean; shelf: string[] }) => {
        if (off) return;
        setSaved(d.shelf.includes(slug));
        setState(!d.enabled ? (d.signedIn ? 'off' : open ? 'anon' : 'off') : 'ready');
      })
      .catch(() => !off && setState('off'));
    return () => {
      off = true;
    };
  }, [slug, open]);

  if (state === 'off') return null;

  const icon = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );

  if (state === 'anon') {
    return (
      <Link href="/account/login" className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>
        {icon}
        {!compact && 'Save'}
      </Link>
    );
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        disabled={pending || state === 'loading'}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved stories' : 'Save this story'}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await toggleSaved(slug);
            if (res.ok) {
              setSaved(res.saved);
              if (res.saved) keepOffline(slug);
            }
            else setMsg(res.error);
          })
        }
        className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80 disabled:opacity-60"
        style={{ color: saved ? 'var(--brand-soft)' : 'var(--text-on-ink-dim)' }}
      >
        {icon}
        {!compact && (saved ? 'Saved' : 'Save')}
      </button>
      {msg && (
        <span className="absolute right-0 top-full mt-2 z-20 w-56 border p-3 text-[0.72rem] normal-case tracking-normal font-sans" style={{ background: 'var(--ink-card)', borderColor: 'var(--border)', color: 'var(--text-body)' }}>
          {msg}
        </span>
      )}
    </span>
  );
}
