'use client';

import { useEffect, useState } from 'react';
import { SYSTEMS, THEMES } from '@/lib/lens';
import { PUSH_CATEGORIES, type PushTopic } from '@/lib/pushMatch';

const PREFS_KEY = 'cl_push_prefs';

type Prefs = { breakingOnly: boolean; topics: PushTopic[] };

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isIosBrowserTab(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua);
  const standalone = (navigator as unknown as { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  return ios && !standalone;
}

export default function NotifyPanel({ vapidKey, onClose, onSubscribedChange }: { vapidKey: string; onClose: () => void; onSubscribedChange: (on: boolean) => void }) {
  const [prefs, setPrefs] = useState<Prefs>({ breakingOnly: true, topics: [] });
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [watchlist, setWatchlist] = useState<PushTopic[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = window.localStorage.getItem(PREFS_KEY);
        if (saved && !cancelled) setPrefs(JSON.parse(saved) as Prefs);
      } catch {
        // no saved preferences
      }
      if (isIosBrowserTab() && !cancelled) setNeedsInstall(true);
      if (/(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) {
        const me = (await fetch('/api/me', { cache: 'no-store' }).then((r) => r.json())) as { enabled?: boolean; interests?: PushTopic[] };
        if (me.enabled && !cancelled) setWatchlist(me.interests ?? []);
      }
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (!cancelled) setSubscribed(!!sub && Notification.permission === 'granted');
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const has = (t: PushTopic) => prefs.topics.some((x) => x.kind === t.kind && x.slug === t.slug);
  const toggleTopic = (t: PushTopic) =>
    setPrefs((p) => ({ ...p, topics: has(t) ? p.topics.filter((x) => !(x.kind === t.kind && x.slug === t.slug)) : [...p.topics, t] }));

  const addWatchlist = () =>
    setPrefs((p) => ({ ...p, topics: [...p.topics, ...watchlist.filter((w) => !p.topics.some((x) => x.kind === w.kind && x.slug === w.slug))] }));

  async function save() {
    setMessage(null);
    if (!prefs.breakingOnly && prefs.topics.length === 0) {
      setMessage('Pick the biggest stories or at least one topic.');
      return;
    }
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setMessage('Notifications are blocked. Allow them for this site in your browser settings, then try again.');
        return;
      }
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) }));
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), prefs }),
      });
      if (!res.ok) throw new Error('save failed');
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {
        // fine without it
      }
      setSubscribed(true);
      onSubscribedChange(true);
      setMessage('Saved. You will get alerts for what you picked.');
    } catch {
      setMessage('Could not turn on notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      onSubscribedChange(false);
      setMessage('Notifications are off.');
    } catch {
      setMessage('Could not turn off. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const chip = (label: string, on: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      aria-pressed={on}
      className="font-mono text-[0.62rem] uppercase tracking-wide rounded-full border px-2.5 py-1.5"
      style={on ? { color: '#fff', background: '#0E7080', borderColor: '#0E7080' } : { borderColor: 'var(--border)' }}
    >
      {on ? '✓ ' : ''}
      {label}
    </button>
  );

  return (
    <div
      role="dialog"
      aria-label="Notify me"
      className="fixed z-50 right-3 top-[64px] md:top-[80px] w-[min(22.5rem,calc(100vw-1.5rem))] max-h-[calc(100vh-90px)] overflow-y-auto border shadow-2xl p-4"
      style={{ background: 'var(--ink-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-display font-bold text-lg">Notify me</div>
        <button onClick={onClose} aria-label="Close" className="font-mono text-base leading-none hover:opacity-70" style={{ color: 'var(--text-on-ink-dim)' }}>
          ×
        </button>
      </div>
      <p className="text-[0.82rem] mb-3" style={{ color: 'var(--text-body)' }}>
        Get an alert on this device when we publish. You choose what.
      </p>

      {needsInstall ? (
        <p className="text-[0.85rem] p-3 border" style={{ borderColor: 'var(--border)' }}>
          On iPhone, first add Chanakya Lens to your Home Screen (Share, then Add to Home Screen), then open it from there to turn on notifications.
        </p>
      ) : (
        <>
          <label className="flex items-center gap-3 p-3 border cursor-pointer mb-3" style={{ borderColor: 'var(--border)' }}>
            <input type="checkbox" checked={prefs.breakingOnly} onChange={(e) => setPrefs((p) => ({ ...p, breakingOnly: e.target.checked }))} className="h-4 w-4" />
            <span className="text-[0.88rem]">
              <b>The biggest stories</b>
              <br />
              <span className="text-[0.75rem]" style={{ color: 'var(--text-on-ink-dim)' }}>Developing stories that directly affect people</span>
            </span>
          </label>

          {watchlist.length > 0 && (
            <button onClick={addWatchlist} className="w-full text-left p-3 border mb-3 text-[0.85rem]" style={{ borderColor: '#0E7080' }}>
              <b>Alert me for my Watchlist</b>
              <br />
              <span className="text-[0.75rem]" style={{ color: 'var(--text-on-ink-dim)' }}>Adds your {watchlist.length} watched items to the topics below</span>
            </button>
          )}

          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-soft)' }}>And these topics</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PUSH_CATEGORIES.map((c) => chip(c, has({ kind: 'category', slug: c }), () => toggleTopic({ kind: 'category', slug: c })))}
          </div>

          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-soft)' }}>Places and themes</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[...SYSTEMS, ...THEMES].map((e) => chip(e.name, has({ kind: 'lens', slug: e.slug }), () => toggleTopic({ kind: 'lens', slug: e.slug })))}
          </div>

          <p className="text-[0.72rem] mb-3" style={{ color: 'var(--text-on-ink-dim)' }}>At most 3 alerts a day. Change or turn off any time.</p>

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={busy} className="px-4 py-2 text-[0.82rem] font-semibold disabled:opacity-60" style={{ background: '#0E7080', color: '#fff' }}>
              {subscribed ? 'Save changes' : 'Allow notifications'}
            </button>
            {subscribed ? (
              <button onClick={turnOff} disabled={busy} className="text-[0.82rem] underline disabled:opacity-60">Turn off</button>
            ) : (
              <button onClick={onClose} className="text-[0.82rem] underline">Not now</button>
            )}
          </div>
        </>
      )}
      {message && <p className="text-[0.8rem] mt-3" style={{ color: 'var(--text-body)' }}>{message}</p>}
    </div>
  );
}
