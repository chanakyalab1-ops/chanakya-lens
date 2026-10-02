'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Proposal } from '@/lib/auto-generate';
import { timeAgo } from '../../admin/time';
import { approveProposals, skipProposals } from '../proposalActions';

const MAX_PER_APPROVAL = 15;

export function ProposalList({ proposals }: { proposals: Proposal[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const chosen = proposals.filter((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(kind: 'approve' | 'skip') {
    if (chosen.length === 0) return;
    setMessage(null);
    startTransition(async () => {
      if (kind === 'approve') {
        const res = await approveProposals(chosen.map((p) => p.candidateIds));
        if (res.ok) {
          setMessage({ ok: true, text: `Generating ${res.data.groupCount} ${res.data.groupCount === 1 ? 'story' : 'stories'}. Drafts show up in your review queue in 30 to 60 minutes.` });
          setSelected(new Set());
          router.refresh();
        } else {
          setMessage({ ok: false, text: res.error });
        }
      } else {
        const res = await skipProposals(chosen.flatMap((p) => p.candidateIds));
        if (res.ok) {
          setMessage({ ok: true, text: `Skipped ${chosen.length} ${chosen.length === 1 ? 'story' : 'stories'}.` });
          setSelected(new Set());
          router.refresh();
        } else {
          setMessage({ ok: false, text: res.error });
        }
      }
    });
  }

  if (proposals.length === 0) {
    return (
      <div className="rounded-sm border p-5 text-[0.9rem]" style={{ background: 'var(--ink-card)', borderColor: 'var(--border)', color: 'var(--text-body)' }}>
        Nothing to propose right now. New articles arrive every 4 hours.
        {message && <div className="mt-3" style={{ color: message.ok ? 'var(--possible)' : 'var(--developing)' }}>{message.text}</div>}
      </div>
    );
  }

  return (
    <>
      {/* Actions stay at the top: the bottom of the screen already carries the tab bar and the signup bar. */}
      <div
        className="sticky top-0 z-20 -mx-4 px-4 py-3 mb-4 border-b backdrop-blur flex items-center gap-2 flex-wrap"
        style={{ background: 'var(--overlay)', borderColor: 'var(--border)' }}
      >
        <span className="font-mono text-[0.72rem] mr-auto" style={{ color: 'var(--text-on-ink)' }}>
          {chosen.length} selected
        </span>
        <button
          type="button"
          onClick={() => setSelected(new Set(proposals.slice(0, 5).map((p) => p.id)))}
          className="font-mono text-[0.68rem] uppercase tracking-wide px-3 py-2 rounded-sm border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-on-ink)' }}
        >
          Top 5
        </button>
        <button
          type="button"
          disabled={chosen.length === 0 || pending}
          onClick={() => run('skip')}
          className="font-mono text-[0.68rem] uppercase tracking-wide px-3 py-2 rounded-sm border disabled:opacity-40"
          style={{ borderColor: 'var(--border)', color: 'var(--text-on-ink)' }}
        >
          Skip
        </button>
        <button
          type="button"
          disabled={chosen.length === 0 || chosen.length > MAX_PER_APPROVAL || pending}
          onClick={() => run('approve')}
          className="text-[0.82rem] font-semibold px-4 py-2 rounded-sm disabled:opacity-40"
          style={{ background: 'var(--brand-soft)', color: 'var(--ink)' }}
        >
          {pending ? 'Working…' : `Generate ${chosen.length || ''}`.trim()}
        </button>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-sm border p-3.5 mb-4 text-[0.85rem]"
          style={{ background: 'var(--ink-card)', borderColor: message.ok ? 'var(--possible)' : 'var(--developing)', color: 'var(--text-on-ink)' }}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {proposals.map((p, i) => {
          const isSelected = selected.has(p.id);
          const isOpen = open === p.id;
          return (
            <div
              key={p.id}
              className="rounded-sm border"
              style={{ background: 'var(--ink-card)', borderColor: isSelected ? 'var(--brand-soft)' : 'var(--border)' }}
            >
              <button type="button" onClick={() => toggle(p.id)} className="w-full text-left p-4 flex gap-3 items-start" aria-pressed={isSelected}>
                <span
                  aria-hidden
                  className="shrink-0 mt-0.5 h-5 w-5 rounded-sm border flex items-center justify-center text-[0.8rem]"
                  style={{ borderColor: isSelected ? 'var(--brand-soft)' : 'var(--border)', background: isSelected ? 'var(--brand-soft)' : 'transparent', color: 'var(--ink)' }}
                >
                  {isSelected ? '✓' : ''}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-bold text-[1.05rem] leading-snug" style={{ color: 'var(--text-on-ink)' }}>
                    {p.headline}
                  </span>
                  <span className="block font-mono text-[0.66rem] mt-1.5" style={{ color: 'var(--text-on-ink-dim)' }}>
                    #{i + 1} · {p.outlets} {p.outlets === 1 ? 'outlet' : 'outlets'} · {p.countries} {p.countries === 1 ? 'country' : 'countries'}
                    {p.newestAt ? ` · latest ${timeAgo(p.newestAt)}` : ''}
                  </span>
                </span>
              </button>
              <div className="px-4 pb-3 pl-12">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  className="font-mono text-[0.66rem] uppercase tracking-wide"
                  style={{ color: 'var(--brand-soft)' }}
                >
                  {isOpen ? 'Hide sources' : `Show ${p.sources.length} ${p.sources.length === 1 ? 'source' : 'sources'}`}
                </button>
                {isOpen && (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {p.sources.map((s) => (
                      <li key={s.id} className="text-[0.78rem] leading-snug" style={{ color: 'var(--text-body)' }}>
                        <span className="font-mono text-[0.66rem] mr-1.5" style={{ color: 'var(--brand-soft)' }}>
                          {s.domain}
                          {s.country ? ` · ${s.country}` : ''}
                        </span>
                        {s.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
