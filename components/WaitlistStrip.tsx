'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const KEY = 'cl_waitlist_strip_closed';

// A slim homepage strip pointing at the Lens+ waitlist. Rendered only while
// membership is not yet public; closing it is remembered on this device.
export default function WaitlistStrip() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setTimeout(() => setShow(true), 0);
    } catch {
      setTimeout(() => setShow(true), 0);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[0.82rem]" style={{ background: '#0E7080', color: '#fff' }}>
      <span>
        <b>Lens+ is coming.</b> New tools for readers who want to go further.{' '}
        <Link href="/membership" className="underline font-semibold">Join the waitlist</Link>
      </span>
      <button
        aria-label="Close"
        onClick={() => {
          setShow(false);
          try {
            window.localStorage.setItem(KEY, '1');
          } catch {
            // fine without it
          }
        }}
        className="shrink-0 text-lg leading-none opacity-80 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
