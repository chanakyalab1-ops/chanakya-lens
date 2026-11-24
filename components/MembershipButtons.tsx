'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

type PaddleJs = {
  Environment: { set: (env: 'sandbox') => void };
  Initialize: (opts: { token: string }) => void;
  Checkout: { open: (opts: Record<string, unknown>) => void };
};

declare global {
  interface Window {
    Paddle?: PaddleJs;
  }
}

export function SubscribeButton({
  token,
  priceId,
  sandbox,
  email,
  userId,
  label = 'Become a Strategist',
  wide = false,
}: {
  token: string;
  priceId: string;
  sandbox: boolean;
  email: string;
  userId: string;
  label?: string;
  wide?: boolean;
}) {
  const [ready, setReady] = useState(false);

  function init() {
    const paddle = window.Paddle;
    if (!paddle) return;
    if (sandbox) paddle.Environment.set('sandbox');
    paddle.Initialize({ token });
    setReady(true);
  }

  function open() {
    window.Paddle?.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email },
      customData: { user_id: userId },
      settings: { displayMode: 'overlay', successUrl: `${window.location.origin}/account?membership=success` },
    });
  }

  return (
    <div>
      <Script src="https://cdn.paddle.com/paddle/v2/paddle.js" strategy="afterInteractive" onLoad={init} onReady={init} />
      <button
        onClick={open}
        disabled={!ready}
        className={`${wide ? 'w-full py-3 text-[0.95rem]' : 'px-5 py-2.5 text-sm'} rounded-sm font-semibold disabled:opacity-60 transition-opacity hover:opacity-90`}
        style={{ background: '#0E7080', color: '#fff' }}
      >
        {label}
      </button>
    </div>
  );
}

export function ManageButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/paddle/portal', { method: 'POST' });
      if (res.status === 401) {
        router.push('/account/login');
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

  return (
    <div>
      <button
        onClick={go}
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
