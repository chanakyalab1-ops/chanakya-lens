'use client';

import { useState } from 'react';
import { readRefCookie } from '@/lib/referral';

export function WaitlistForm({ source }: { source: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    const form = e.target as HTMLFormElement;
    const website = (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, website, source, ref: readRefCookie(document.cookie) }) });
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
        <div className="font-display font-extrabold text-xl mb-1">You are on the list.</div>
        <p className="text-sm" style={{ color: 'var(--text-body)' }}>We will email you first when Lens+ opens, so you can join before everyone else.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
        className="flex-1 rounded-sm border px-4 py-3 bg-transparent text-[0.95rem]"
        style={{ borderColor: 'var(--border)' }}
      />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button disabled={status === 'loading'} className="px-6 py-3 text-sm font-semibold text-white rounded-sm disabled:opacity-60" style={{ background: '#0E7080' }}>
        {status === 'loading' ? 'Joining…' : 'Join the waitlist'}
      </button>
      {status === 'error' && <p className="text-sm sm:basis-full" style={{ color: 'var(--developing)' }}>{error}</p>}
    </form>
  );
}
