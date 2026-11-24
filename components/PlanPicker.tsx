'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SubscribeButton } from './MembershipButtons';
import { splitPriceLabel, yearlySavings } from '@/lib/priceLabel';

export type Plan = { priceId: string; label: string };

// Two selectable plan cards and one clear button. Visitors who are not signed in
// see the prices too, with "Sign in to join" in place of checkout.
export default function PlanPicker({
  token,
  sandbox,
  user,
  monthly,
  yearly,
}: {
  token: string;
  sandbox: boolean;
  user: { email: string; id: string } | null;
  monthly: Plan;
  yearly: Plan | null;
}) {
  const [choice, setChoice] = useState<'monthly' | 'yearly'>(yearly ? 'yearly' : 'monthly');
  const plan = choice === 'yearly' && yearly ? yearly : monthly;
  const m = splitPriceLabel(monthly.label);
  const y = yearly ? splitPriceLabel(yearly.label) : null;
  const saving = y ? yearlySavings(m.amount, y.amount) : null;

  const card = (key: 'monthly' | 'yearly', title: string, amount: string, period: string, badge?: string | null) => {
    const on = choice === key;
    return (
      <button
        key={key}
        role="radio"
        aria-checked={on}
        onClick={() => setChoice(key)}
        className="relative text-left p-4 border rounded-sm transition-all hover:-translate-y-0.5"
        style={{
          borderColor: on ? '#0E7080' : 'var(--border)',
          background: 'var(--ink-card)',
          boxShadow: on ? '0 0 0 2px #0E7080' : 'none',
        }}
      >
        {badge && (
          <span className="absolute -top-2.5 right-3 font-mono text-[0.6rem] uppercase tracking-wide px-2 py-0.5" style={{ background: '#C97B4A', color: '#fff' }}>
            {badge}
          </span>
        )}
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[0.68rem] uppercase tracking-widest" style={{ color: 'var(--text-on-ink-dim)' }}>{title}</span>
          <span
            aria-hidden
            className="h-4 w-4 rounded-full border flex items-center justify-center text-[0.6rem]"
            style={{ borderColor: on ? '#0E7080' : 'var(--border)', background: on ? '#0E7080' : 'transparent', color: '#fff' }}
          >
            {on ? '✓' : ''}
          </span>
        </div>
        <div className="font-display font-bold text-3xl leading-none">
          {amount}
          {period && <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-on-ink-dim)', fontFamily: 'var(--font-plex-sans), sans-serif' }}>/ {period}</span>}
        </div>
      </button>
    );
  };

  return (
    <div>
      <div className={`grid gap-3 mb-4 ${yearly ? 'sm:grid-cols-2' : ''}`} role="radiogroup" aria-label="Billing period">
        {yearly && y && card('yearly', 'Yearly', y.amount, y.period, saving ?? 'Best value')}
        {card('monthly', 'Monthly', m.amount, m.period)}
      </div>
      {user ? (
        <SubscribeButton key={plan.priceId} token={token} priceId={plan.priceId} sandbox={sandbox} email={user.email} userId={user.id} label="Upgrade to Lens+" wide />
      ) : (
        <Link href="/account/login" className="block text-center px-5 py-3 rounded-sm text-[0.95rem] font-semibold transition-opacity hover:opacity-90" style={{ background: '#0E7080', color: '#fff' }}>
          Sign in to join
        </Link>
      )}
    </div>
  );
}
