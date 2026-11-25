'use client';

import { useState } from 'react';
import Script from 'next/script';

type PaddleJs = {
  Environment: { set: (env: 'sandbox') => void };
  Initialize: (opts: { token: string }) => void;
  Checkout: { open: (opts: Record<string, unknown>) => void };
};

// Opens Paddle checkout for a one-year Lens+ gift. No account is needed to buy;
// the code is emailed to the buyer once the payment completes.
export function GiftButton({ token, priceId, sandbox, label }: { token: string; priceId: string; sandbox: boolean; label: string }) {
  const [ready, setReady] = useState(false);

  function init() {
    const paddle = (window as unknown as { Paddle?: PaddleJs }).Paddle;
    if (!paddle) return;
    if (sandbox) paddle.Environment.set('sandbox');
    paddle.Initialize({ token });
    setReady(true);
  }

  function open() {
    (window as unknown as { Paddle?: PaddleJs }).Paddle?.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: { gift: '1y' },
      settings: { displayMode: 'overlay', successUrl: `${window.location.origin}/gift?thanks=1` },
    });
  }

  return (
    <div>
      <Script src="https://cdn.paddle.com/paddle/v2/paddle.js" strategy="afterInteractive" onLoad={init} onReady={init} />
      <button onClick={open} disabled={!ready} className="w-full py-3.5 text-[0.95rem] rounded-sm font-semibold disabled:opacity-60 hover:opacity-90" style={{ background: '#0E7080', color: '#fff' }}>
        {label}
      </button>
    </div>
  );
}
