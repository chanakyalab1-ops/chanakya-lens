'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { toggleShelf } from '@/app/account/shelf/actions';

// "Keep" a story on your Shelf. The story page is cached for everyone, so whether
// it is already kept is asked for in the browser, and only when a session cookie exists.
export function SaveButton({ slug, compact, open }: { slug: string; compact?: boolean; open: boolean }) {
  const [state, setState] = useState<'loading' | 'anon' | 'ready' | 'off'>('loading');
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<{ text: string; limit?: boolean } | null>(null);
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
      <Link href="/account/login" className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>
        {icon}
        {!compact && 'Keep'}
      </Link>
    );
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        disabled={pending || state === 'loading'}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from your Shelf' : 'Keep on your Shelf'}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await toggleShelf(slug);
            if (res.ok) setSaved(res.saved);
            else setMsg({ text: res.error, limit: res.limit });
          })
        }
        className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80 disabled:opacity-60"
        style={{ color: saved ? 'var(--brand-soft)' : 'var(--text-on-ink-dim)' }}
      >
        {icon}
        {!compact && (saved ? 'Kept' : 'Keep')}
      </button>
      {msg && (
        <span className="absolute right-0 top-full mt-2 z-20 w-56 border p-3 text-[0.72rem] normal-case tracking-normal font-sans" style={{ background: 'var(--ink-card)', borderColor: 'var(--border)', color: 'var(--text-body)' }}>
          {msg.text}{' '}
          {msg.limit && <Link href="/membership" className="underline">Upgrade to Lens+</Link>}
        </span>
      )}
    </span>
  );
}
