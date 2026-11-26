'use client';

import { useState } from 'react';

export function CreatorForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(f.entries());
    try {
      const res = await fetch('/api/creators/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
        <div className="font-display font-extrabold text-xl mb-1">Thank you. We have your application.</div>
        <p className="text-sm" style={{ color: 'var(--text-body)' }}>We read every one and will reply by email, usually within a few days.</p>
      </div>
    );
  }

  const input = 'w-full rounded-sm border px-4 py-3 bg-transparent text-[0.95rem]';
  const style = { borderColor: 'var(--border)' };
  return (
    <form onSubmit={submit} className="grid gap-3">
      <input name="name" required maxLength={80} placeholder="Your name or channel name" aria-label="Name" className={input} style={style} />
      <input name="email" type="email" required placeholder="Email" aria-label="Email" className={input} style={style} />
      <input name="channelUrl" required placeholder="Link to your channel, newsletter or page" aria-label="Channel link" className={input} style={style} />
      <input name="audience" maxLength={40} placeholder="Audience size, roughly (optional)" aria-label="Audience size" className={input} style={style} />
      <textarea name="note" rows={3} maxLength={600} placeholder="Anything we should know? (optional)" aria-label="Note" className={input} style={style} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button disabled={status === 'loading'} className="px-6 py-3 text-sm font-semibold text-white rounded-sm disabled:opacity-60" style={{ background: '#0E7080' }}>
        {status === 'loading' ? 'Sending…' : 'Apply to partner with us'}
      </button>
      {status === 'error' && <p className="text-sm" style={{ color: 'var(--developing)' }}>{error}</p>}
    </form>
  );
}
