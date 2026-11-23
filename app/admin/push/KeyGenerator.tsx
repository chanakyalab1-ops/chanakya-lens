'use client';

import { useState } from 'react';
import { generateVapidKeys } from './actions';

export function KeyGenerator() {
  const [keys, setKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function make() {
    setBusy(true);
    setError(null);
    const res = await generateVapidKeys();
    if (res.ok) setKeys({ publicKey: res.publicKey, privateKey: res.privateKey });
    else setError(res.error);
    setBusy(false);
  }

  const row = (label: string, name: string, value: string) => (
    <div className="mb-3">
      <div className="font-mono text-[0.65rem] uppercase tracking-wide mb-1" style={{ color: 'var(--text-on-ink-dim)' }}>
        {label} · Vercel name: <b>{name}</b>
      </div>
      <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="w-full font-mono text-xs border px-2 py-2 bg-transparent" style={{ borderColor: 'var(--border)' }} />
    </div>
  );

  return (
    <div>
      <button onClick={make} disabled={busy} className="px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: '#0E7080', color: '#fff' }}>
        {busy ? 'Making…' : keys ? 'Make a new pair' : 'Generate keys'}
      </button>
      {error && <p className="text-sm mt-2" style={{ color: 'var(--developing)' }}>{error}</p>}
      {keys && (
        <div className="mt-4">
          {row('Public key', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', keys.publicKey)}
          {row('Private key (keep secret, mark Sensitive)', 'VAPID_PRIVATE_KEY', keys.privateKey)}
          <p className="text-xs" style={{ color: 'var(--text-on-ink-dim)' }}>
            Copy both into Vercel (Production), then redeploy. This page does not store them, and a new pair replaces these, which would stop alerts to everyone already subscribed.
          </p>
        </div>
      )}
    </div>
  );
}
