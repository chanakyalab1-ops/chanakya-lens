'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Loaded only when the bell is opened, so the places and themes data stays out of every page.
const NotifyPanel = dynamic(() => import('./NotifyPanel'), { ssr: false });

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export default function NotifyBell() {
  const [supported, setSupported] = useState(false);
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const ok = !!VAPID && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    // iPhone browser tabs lack PushManager until installed; still show the bell so the panel can explain.
    const iosTab = /iPhone|iPad|iPod/.test(navigator.userAgent);
    Promise.resolve().then(() => setSupported(!!VAPID && (ok || iosTab)));
    if (ok) {
      navigator.serviceWorker
        .getRegistration('/sw.js')
        .then((reg) => reg?.pushManager.getSubscription())
        .then((sub) => setOn(!!sub && Notification.permission === 'granted'))
        .catch(() => {});
    }
  }, []);

  if (!supported || !VAPID) return null;

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications" aria-expanded={open} className="relative p-1.5 hover:opacity-80" style={{ color: on ? '#0E7080' : 'var(--text-on-ink-dim)' }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {!on && <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full" style={{ background: '#C97B4A' }} />}
      </button>
      {open && <NotifyPanel vapidKey={VAPID} onClose={() => setOpen(false)} onSubscribedChange={setOn} />}
    </>
  );
}
