'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { askLens, type AskResult } from './actions';

export function AskForm({ limit }: { limit: number }) {
  const [q, setQ] = useState('');
  const [result, setResult] = useState<AskResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => setResult(await askLens(q)));
        }}
        className="flex flex-col gap-3 mb-6"
      >
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="e.g. How does the Hormuz disruption affect oil prices?"
          className="w-full rounded-sm border p-3 text-[0.95rem] bg-transparent"
          style={{ borderColor: 'var(--border)' }}
        />
        <div className="flex items-center gap-3">
          <button disabled={pending || q.trim().length < 8} className="px-5 py-2.5 text-sm font-semibold text-white rounded-sm disabled:opacity-50" style={{ background: '#0E7080' }}>
            {pending ? 'Reading the stories…' : 'Ask'}
          </button>
          <span className="font-mono text-[0.65rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>
            {result?.ok ? `${result.left} left today` : `${limit} questions a day`}
          </span>
        </div>
      </form>
      {result && !result.ok && <p className="text-sm" style={{ color: 'var(--developing)' }}>{result.error}</p>}
      {result?.ok && (
        <div className="rounded-sm border p-5" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
          <p className="text-[0.98rem] leading-relaxed whitespace-pre-line">{result.answer}</p>
          {result.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: 'var(--text-on-ink-dim)' }}>From these stories</div>
              <ul className="space-y-1.5">
                {result.sources.map((s) => (
                  <li key={s.slug}><Link href={`/story/${s.slug}`} className="underline text-[0.88rem]">{s.headline}</Link></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
