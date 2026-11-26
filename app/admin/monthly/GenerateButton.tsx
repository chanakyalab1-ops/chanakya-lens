'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { generateDraftNow } from './actions';

export function GenerateButton() {
  const router = useRouter();
  const [period, setPeriod] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="rounded-sm border p-4 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
      <div className="font-semibold mb-1">Draft a month automatically</div>
      <p className="text-[0.8rem] mb-3" style={{ color: 'var(--text-body)' }}>
        The site drafts the current month on the 27th by itself. To draft one now (or an earlier month), enter it below. The draft is always saved unpublished, and costs about one cent.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-11 (blank = this month)" className="rounded border border-white/15 bg-transparent p-2 text-sm" />
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await generateDraftNow(period.trim() || undefined);
              if (r.ok) {
                setMsg(r.created ? 'Draft made.' : 'That month already has a report.');
                router.push(`/admin/monthly?edit=${r.slug}`);
              } else setMsg(r.error);
            })
          }
          className="px-4 py-2 text-sm font-medium rounded bg-[#C97B4A] text-[#0B1220] disabled:opacity-40"
        >
          {pending ? 'Drafting…' : 'Make the draft'}
        </button>
        {msg && <span className="text-sm text-[#8A93A6]">{msg}</span>}
      </div>
    </div>
  );
}
