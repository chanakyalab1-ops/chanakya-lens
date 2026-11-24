'use client';

import { useState } from 'react';
import { BUSINESS_ROLES } from '@/lib/businessWaitlist';

export function BusinessForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch('/api/business-waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) setStatus('done');
      else {
        setError(data.error ?? 'Could not save. Try again.');
        setStatus('error');
      }
    } catch {
      setError('Could not save. Try again.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-sm border p-5 text-center" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
        <div className="font-display font-extrabold text-xl mb-1">You are on the pilot list.</div>
        <p className="text-sm" style={{ color: 'var(--text-body)' }}>We will send you a free sample brief first and ask what would make it useful for you.</p>
      </div>
    );
  }

  const input = 'w-full rounded-sm border px-4 py-3 bg-transparent text-[0.95rem]';
  const style = { borderColor: 'var(--border)' };
  return (
    <form onSubmit={submit} className="grid gap-3">
      <input name="name" required maxLength={80} placeholder="Your name" aria-label="Name" className={input} style={style} />
      <input name="email" type="email" required placeholder="Work email" aria-label="Work email" className={input} style={style} />
      <input name="company" required maxLength={100} placeholder="Company" aria-label="Company" className={input} style={style} />
      <select name="role" defaultValue="" aria-label="What best describes you" className={input} style={style}>
        <option value="">What best describes you? (optional)</option>
        {BUSINESS_ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <textarea name="interests" rows={3} maxLength={400} placeholder="Routes, ports or countries you ship through (optional)" aria-label="Routes or countries" className={input} style={style} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button disabled={status === 'loading'} className="px-6 py-3 text-sm font-semibold text-white rounded-sm disabled:opacity-60" style={{ background: '#0E7080' }}>
        {status === 'loading' ? 'Joining…' : 'Join the pilot list'}
      </button>
      {status === 'error' && <p className="text-sm" style={{ color: 'var(--developing)' }}>{error}</p>}
    </form>
  );
}
