'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function go(path: string, setBusy: (b: boolean) => void, setError: (e: string | null) => void, signIn: () => void) {
  setError(null);
  setBusy(true);
  try {
    const res = await fetch(path, { method: 'POST' });
    if (res.status === 401) {
      signIn();
      return;
    }
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !json.url) throw new Error(json.error ?? 'Something went wrong.');
    window.location.href = json.url;
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Something went wrong.');
    setBusy(false);
  }
}

export function SubscribeButton({ label = 'Become a Strategist' }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        onClick={() => go('/api/stripe/checkout', setBusy, setError, () => router.push('/account/login'))}
        disabled={busy}
        className="px-5 py-2.5 rounded-sm text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: '#0E7080' }}
      >
        {busy ? 'Opening checkout…' : label}
      </button>
      {error && <p className="text-sm mt-2" style={{ color: 'var(--developing)' }}>{error}</p>}
    </div>
  );
}

export function ManageButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        onClick={() => go('/api/stripe/portal', setBusy, setError, () => router.push('/account/login'))}
        disabled={busy}
        className="px-4 py-2 rounded-sm border text-sm font-semibold disabled:opacity-60"
        style={{ borderColor: 'var(--border)' }}
      >
        {busy ? 'Opening…' : 'Manage billing'}
      </button>
      {error && <p className="text-sm mt-2" style={{ color: 'var(--developing)' }}>{error}</p>}
    </div>
  );
}
