'use client';

import { useState } from 'react';

export function GroupPlanForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch('/api/group-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) setStatus('done');
      else {
        setError(data.error ?? 'Could not send. Try again.');
        setStatus('error');
      }
    } catch {
      setError('Could not send. Try again.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-sm border p-5 text-center" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
        <div className="font-display font-extrabold text-xl mb-1">Thank you. We have your request.</div>
        <p className="text-sm" style={{ color: 'var(--text-body)' }}>We will email you a quote, usually within a few days.</p>
      </div>
    );
  }

  const input = 'w-full rounded-sm border px-4 py-3 bg-transparent text-[0.95rem]';
  const style = { borderColor: 'var(--border)' };
  return (
    <form onSubmit={submit} className="grid gap-3">
      <input name="name" required maxLength={80} placeholder="Your name" aria-label="Name" className={input} style={style} />
      <input name="email" type="email" required placeholder="Email" aria-label="Email" className={input} style={style} />
      <input name="organisation" maxLength={100} placeholder="School, company or group (optional)" aria-label="Organisation" className={input} style={style} />
      <input name="seats" maxLength={20} placeholder="How many people? (roughly)" aria-label="Seats" className={input} style={style} />
      <textarea name="note" rows={3} maxLength={500} placeholder="Anything else? (optional)" aria-label="Note" className={input} style={style} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button disabled={status === 'loading'} className="px-6 py-3 text-sm font-semibold text-white rounded-sm disabled:opacity-60" style={{ background: '#0E7080' }}>
        {status === 'loading' ? 'Sending…' : 'Ask for a group quote'}
      </button>
      {status === 'error' && <p className="text-sm" style={{ color: 'var(--developing)' }}>{error}</p>}
    </form>
  );
}
