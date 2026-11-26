'use client';

import { useEffect, useState, useTransition } from 'react';
import { emailStoryToMe } from '@/app/account/saved/emailActions';

// "Email me this story". Story pages are cached for everyone, so whether the
// reader may use it is asked in the browser; hidden until MEMBERSHIP_PUBLIC=true
// for everyone but the owner.
export function EmailStoryButton({ slug, open, compact }: { slug: string; open: boolean; compact?: boolean }) {
  const [show, setShow] = useState(false);
  const [locked, setLocked] = useState(false);
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
      .then((d: { enabled?: boolean; paid?: string }) => {
        if (off) return;
        // Readers who can't use the tool yet see it as a locked Lens+ link, never the working button.
        setShow(!!d.enabled || open);
        setLocked(!d.enabled || d.paid === 'locked');
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [open]);

  if (!show) return null;
  if (locked) {
    return (
      <a href="/membership" title="Email me is for Lens+ members" aria-label="Email me this story" className={`inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80 ${compact ? 'justify-center w-9 h-9' : ''}`} style={{ color: 'var(--text-on-ink-dim)' }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
        {!compact && 'Email me · Lens+'}
      </a>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await emailStoryToMe(slug);
          setMsg(r.ok ? 'Sent to your inbox' : r.error ?? 'Could not send');
          setTimeout(() => setMsg(null), 4000);
        })
      }
      aria-label="Email me this story"
      className={`inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80 disabled:opacity-60 ${compact ? 'justify-center w-9 h-9' : ''}`}
      style={{ color: msg ? 'var(--brand-soft)' : 'var(--text-on-ink-dim)' }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
      {!compact ? (msg ?? 'Email me') : msg}
    </button>
  );
}
