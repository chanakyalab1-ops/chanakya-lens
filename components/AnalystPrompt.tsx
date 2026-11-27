'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Piece = { id: string; title: string; status: string; label: string };

// Shown only to our analysts (and the owner), right on a story: the place to write the analysis of it.
export function AnalystPrompt({ slug }: { slug: string }) {
  const [pieces, setPieces] = useState<Piece[] | null>(null);

  useEffect(() => {
    if (!/(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) return;
    let off = false;
    fetch(`/api/analyst?story=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { analyst?: boolean; pieces?: Piece[] }) => !off && d.analyst && setPieces(d.pieces ?? []))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [slug]);

  if (!pieces) return null;
  return (
    <section className="mb-6 rounded-sm border p-4 md:max-w-[42rem]" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
      <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-soft)' }}>For our analysts</div>
      {pieces.length === 0 ? (
        <p className="text-[0.9rem] mb-3" style={{ color: 'var(--text-body)' }}>Write your analysis of this story. It goes live right here under the story when you publish it.</p>
      ) : (
        <ul className="mb-3 space-y-1.5">
          {pieces.map((p) => (
            <li key={p.id} className="text-[0.9rem]">
              <Link href={`/writer/${p.id}`} className="underline" style={{ color: 'var(--brand-soft)' }}>{p.title}</Link>
              <span className="text-xs ml-2" style={{ color: 'var(--text-on-ink-dim)' }}>{p.label}</span>
            </li>
          ))}
        </ul>
      )}
      <Link href={`/writer/new?story=${encodeURIComponent(slug)}`} className="inline-block px-4 py-2 text-sm font-semibold rounded-sm text-white" style={{ background: '#0E7080' }}>
        {pieces.length === 0 ? 'Write about this story' : 'Write another'}
      </Link>
    </section>
  );
}
