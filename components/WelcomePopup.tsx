'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WHATS_NEW } from '@/lib/whatsNew';
import { decidePopup, latestDate, popupAllowedOn, type PopupDecision } from '@/lib/popup';

const INTRO_KEY = 'cl_intro_dismissed';
const SEEN_KEY = 'cl_whatsnew_seen';
const DELAY_MS = 4000;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage blocked: the pop-up may show again next visit, which is harmless
  }
}

// A small card in the corner, never a full-screen interstitial: first visit gets a
// welcome, later visits hear about new features once. Waits a few seconds so it does
// not compete with the story the reader came for.
export default function WelcomePopup() {
  const pathname = usePathname();
  const [decision, setDecision] = useState<PopupDecision>(null);

  useEffect(() => {
    if (!popupAllowedOn(pathname)) return;
    const timer = window.setTimeout(() => {
      const d = decidePopup({ seenIntro: read(INTRO_KEY) === '1', lastSeenDate: read(SEEN_KEY), entries: WHATS_NEW });
      if (!d) return;
      write(INTRO_KEY, '1');
      const latest = latestDate(WHATS_NEW);
      if (latest) write(SEEN_KEY, latest);
      setDecision(d);
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!decision) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDecision(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decision]);

  if (!decision || !popupAllowedOn(pathname)) return null;

  const close = () => setDecision(null);

  return (
    <aside
      role="dialog"
      aria-label={decision.kind === 'welcome' ? 'Welcome to Chanakya Lens' : "What's new"}
      className="fixed z-40 right-3 bottom-24 md:bottom-20 w-[min(22rem,calc(100vw-1.5rem))] rounded-sm border shadow-lg"
      style={{ background: 'var(--ink-card)', borderColor: 'var(--border)' }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="font-mono text-[0.62rem] uppercase tracking-widest" style={{ color: 'var(--brand-soft)' }}>
            {decision.kind === 'welcome' ? 'Welcome' : "What's new"}
          </div>
          <button onClick={close} aria-label="Close" className="font-mono text-base leading-none hover:opacity-70" style={{ color: 'var(--text-on-ink-dim)' }}>
            ×
          </button>
        </div>

        {decision.kind === 'welcome' ? (
          <>
            <div className="font-display font-bold text-lg leading-tight mb-1.5">Geopolitics, traced to what it means for you</div>
            <p className="text-[0.85rem] leading-snug mb-3" style={{ color: 'var(--text-body)' }}>
              Every story shows what happened, Chanakya&apos;s Move, how it could affect you, and which countries are covering it.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/start-here" onClick={close} className="px-3 py-1.5 text-[0.8rem] font-semibold rounded-sm" style={{ background: '#0E7080', color: '#fff' }}>
                Start here
              </Link>
              <Link href="/digest" onClick={close} className="px-3 py-1.5 text-[0.8rem] font-semibold rounded-sm border" style={{ borderColor: 'var(--border)' }}>
                Get the daily digest
              </Link>
            </div>
          </>
        ) : (
          <>
            <ul className="space-y-2 mb-3">
              {decision.entries.map((e) => (
                <li key={`${e.date}-${e.title}`} className="text-[0.85rem] leading-snug">
                  <span className="font-semibold">{e.title}</span>
                </li>
              ))}
            </ul>
            <Link href="/whats-new" onClick={close} className="text-[0.82rem] underline" style={{ color: 'var(--brand-soft)' }}>
              See what&apos;s new →
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
