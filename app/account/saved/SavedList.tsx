'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toggleSaved } from './actions';

type Item = { slug: string; headline: string; category: string };

export function SavedList({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const remove = (slug: string) =>
    start(async () => {
      const res = await toggleSaved(slug);
      if (res.ok) setItems((p) => p.filter((i) => i.slug !== slug));
    });

  if (items.length === 0) return <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>Nothing saved yet. Tap Save on any story.</p>;
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.slug} className="flex items-start justify-between gap-3 rounded-sm border p-3" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
          <Link href={`/story/${it.slug}`} className="min-w-0 hover:opacity-80">
            <div className="font-mono text-[0.62rem] uppercase" style={{ color: 'var(--brand-soft)' }}>{it.category}</div>
            <div className="text-sm font-semibold leading-snug">{it.headline}</div>
          </Link>
          <button onClick={() => remove(it.slug)} disabled={pending} className="shrink-0 font-mono text-[0.62rem] uppercase underline disabled:opacity-60" style={{ color: 'var(--text-on-ink-dim)' }}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
