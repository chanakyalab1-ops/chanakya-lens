'use client';

import Script from 'next/script';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type PaddleJs = { Environment: { set: (env: 'sandbox') => void }; Initialize: (opts: { token: string }) => void };

// The page Paddle sends customers to for payment links (an update-card link, a link from a renewal email).
// Paddle.js reads the `_ptxn` value in the address and opens the secure checkout by itself.
export default function CheckoutLanding({ token, sandbox }: { token: string; sandbox: boolean }) {
  const [hasLink, setHasLink] = useState<boolean | null>(null);

  useEffect(() => {
    setTimeout(() => setHasLink(new URLSearchParams(window.location.search).has('_ptxn')), 0);
  }, []);

  function init() {
    const paddle = (window as unknown as { Paddle?: PaddleJs }).Paddle;
    if (!paddle || !token) return;
    if (sandbox) paddle.Environment.set('sandbox');
    paddle.Initialize({ token });
  }

  return (
    <main className="max-w-md mx-auto px-5 pt-24 pb-24 text-center">
      {token && <Script src="https://cdn.paddle.com/paddle/v2/paddle.js" strategy="afterInteractive" onLoad={init} onReady={init} />}
      <h1 className="font-display font-extrabold text-3xl mb-3">Secure checkout</h1>
      {hasLink === false || !token ? (
        <p className="text-[0.95rem] leading-relaxed" style={{ color: 'var(--text-body)' }}>
          This page opens a payment link from Paddle, our payment partner. If you were sent here by an email, open the link in that email again. Otherwise there is nothing to do here.
        </p>
      ) : (
        <p className="text-[0.95rem] leading-relaxed" style={{ color: 'var(--text-body)' }}>Opening your secure checkout…</p>
      )}
      <p className="mt-8 text-sm">
        <Link href="/" className="underline" style={{ color: 'var(--brand-soft)' }}>Back to Chanakya Lens</Link>
      </p>
    </main>
  );
}
