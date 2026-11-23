'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const KEY = 'cl_intro_dismissed';

// A slim explainer shown once to first-time visitors. Remembered in the browser.
export default function FirstVisitStrip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(KEY) === '1';
    } catch {
      // storage blocked: show it, it can be dismissed for this visit
    }
    Promise.resolve().then(() => setShow(!dismissed));
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 text-[0.82rem]">
        <p className="flex-1" style={{ color: 'var(--text-body)' }}>
          <strong>New here?</strong> Every story shows what happened, Chanakya&apos;s Move, how it could affect you, and who is covering it.{' '}
          <Link href="/start-here" className="underline whitespace-nowrap" style={{ color: 'var(--brand-soft)' }}>
            Start here →
          </Link>
        </p>
        <button onClick={dismiss} aria-label="Dismiss" className="font-mono text-sm px-2 hover:opacity-70" style={{ color: 'var(--text-on-ink-dim)' }}>
          ×
        </button>
      </div>
    </div>
  );
}
