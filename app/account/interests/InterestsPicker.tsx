'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toggleInterest } from './actions';
import type { InterestKind } from '@/lib/interests';

type Option = { kind: InterestKind; slug: string; name: string };
type Group = { title: string; options: Option[] };

export function InterestsPicker({
  groups,
  initial,
  freeLimit,
  limitApplies,
  isMember,
}: {
  groups: Group[];
  initial: string[]; // "kind:slug"
  freeLimit: number;
  limitApplies: boolean;
  isMember: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  const [error, setError] = useState<string | null>(null);
  const [hitLimit, setHitLimit] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(o: Option) {
    const key = `${o.kind}:${o.slug}`;
    setError(null);
    setHitLimit(false);
    startTransition(async () => {
      const res = await toggleInterest(o.kind, o.slug);
      if (!res.ok) {
        setError(res.error);
        setHitLimit(!!res.limit);
        return;
      }
      setSelected((prev) => {
        const next = new Set(prev);
        if (res.selected) next.add(key);
        else next.delete(key);
        return next;
      });
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between border p-3 mb-4 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
        <span>
          <b>{selected.size}</b> {limitApplies && !isMember ? `of ${freeLimit} free ` : ''}followed
        </span>
        {limitApplies && !isMember && <span style={{ color: 'var(--text-on-ink-dim)' }}>Strategists follow unlimited</span>}
      </div>

      {hitLimit && (
        <div className="border p-4 mb-4" style={{ borderColor: '#C97B4A', borderLeftWidth: 4, background: 'var(--ink-card)' }}>
          <div className="font-semibold mb-1">You&apos;re following {freeLimit} interests, the free limit.</div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-on-ink-dim)' }}>
            Strategists follow unlimited topics, countries and Lens pages.
          </p>
          <Link href="/membership" className="inline-block px-4 py-2 text-sm font-semibold text-white" style={{ background: '#0E7080' }}>
            Become a Strategist
          </Link>
        </div>
      )}
      {error && !hitLimit && <p className="text-sm mb-3" style={{ color: 'var(--developing)' }}>{error}</p>}

      {groups.map((g) => (
        <section key={g.title} className="mb-6">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-soft)' }}>{g.title}</h2>
          <div className="flex flex-wrap gap-2">
            {g.options.map((o) => {
              const on = selected.has(`${o.kind}:${o.slug}`);
              return (
                <button
                  key={`${o.kind}:${o.slug}`}
                  onClick={() => toggle(o)}
                  disabled={pending}
                  aria-pressed={on}
                  className="font-mono text-[0.68rem] uppercase tracking-wide rounded-full border px-3 py-1.5 transition-colors disabled:opacity-60"
                  style={on ? { color: '#fff', background: '#0E7080', borderColor: '#0E7080' } : { borderColor: 'var(--border)' }}
                >
                  {on ? '✓ ' : ''}{o.name}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
