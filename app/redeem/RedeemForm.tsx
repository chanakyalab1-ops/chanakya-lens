'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { redeemGift } from './actions';

export function RedeemForm() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ ok: true; endsAt: string } | { ok: false; error: string } | null>(null);
  const [pending, start] = useTransition();

  if (result?.ok) {
    return (
      <div className="rounded-sm border p-6 text-center" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
        <div className="font-display font-extrabold text-2xl mb-1">You have Lens+.</div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-body)' }}>Your gift runs until {new Date(result.endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
        <Link href="/account" className="inline-block px-6 py-3 text-sm font-semibold rounded-sm" style={{ background: '#0E7080', color: '#fff' }}>Go to your account</Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setResult(await redeemGift(code)));
      }}
      className="grid gap-3"
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="XXXX-XXXX-XXXX"
        aria-label="Gift code"
        autoComplete="off"
        className="w-full rounded-sm border px-4 py-3 bg-transparent text-center font-mono text-lg tracking-widest uppercase"
        style={{ borderColor: 'var(--border)' }}
      />
      <button disabled={pending || code.trim().length < 12} className="px-6 py-3 text-sm font-semibold text-white rounded-sm disabled:opacity-50" style={{ background: '#0E7080' }}>
        {pending ? 'Checking…' : 'Redeem'}
      </button>
      {result && !result.ok && <p className="text-sm text-center" style={{ color: 'var(--developing)' }}>{result.error}</p>}
    </form>
  );
}
