'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Connection } from '@/lib/connections';

// The story page is cached for everyone, so whether this reader may see
// Connections is asked in the browser. Hidden from everyone but the owner until
// MEMBERSHIP_PUBLIC=true (the `open` prop).
export function ConnectionsSection({ connections, open }: { connections: Connection[]; open: boolean }) {
  const [show, setShow] = useState(open);
  useEffect(() => {
    if (open || !/(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) return;
    let off = false;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => !off && setShow(!!d.enabled))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [open]);

  if (!show || connections.length === 0) return null;
  return (
    <section className="mt-10 md:max-w-[42rem]">
      <h2 className="font-display font-bold uppercase tracking-wide text-lg mb-1" style={{ color: 'var(--brand-soft)' }}>
        Connected through
      </h2>
      <p className="text-[0.78rem] mb-4" style={{ color: 'var(--text-on-ink-dim)' }}>Other stories on the same places, actors and themes.</p>
      <div className="space-y-5">
        {connections.map((c) => (
          <div key={c.entity.slug}>
            <Link href={`/lens/${c.entity.slug}`} className="font-mono text-[0.6875rem] uppercase tracking-widest hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>
              {c.entity.name} →
            </Link>
            <ul className="mt-2 space-y-2">
              {c.stories.map((s) => (
                <li key={s.slug}>
                  <Link href={`/story/${s.slug}`} className="block p-3 rounded-sm border hover:opacity-80 text-[0.9rem] leading-snug" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                    <span className="font-mono text-[0.6875rem] uppercase tracking-wide block mb-1" style={{ color: 'var(--brand-soft)' }}>{s.category}</span>
                    {s.headline}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
