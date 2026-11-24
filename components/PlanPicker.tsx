'use client';

import { useState } from 'react';
import { SubscribeButton } from './MembershipButtons';

export type Plan = { priceId: string; label: string; note?: string };

// Monthly / Yearly choice. With no yearly price configured it shows just the monthly one.
export default function PlanPicker({
  token,
  sandbox,
  email,
  userId,
  monthly,
  yearly,
}: {
  token: string;
  sandbox: boolean;
  email: string;
  userId: string;
  monthly: Plan;
  yearly: Plan | null;
}) {
  const [choice, setChoice] = useState<'monthly' | 'yearly'>('monthly');
  const plan = choice === 'yearly' && yearly ? yearly : monthly;

  return (
    <div className="space-y-3">
      {yearly && (
        <div className="inline-flex border rounded-sm overflow-hidden" role="radiogroup" aria-label="Billing period" style={{ borderColor: 'var(--border)' }}>
          {(['monthly', 'yearly'] as const).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={choice === c}
              onClick={() => setChoice(c)}
              className="px-4 py-1.5 text-[0.82rem] font-semibold"
              style={choice === c ? { background: '#0E7080', color: '#fff' } : {}}
            >
              {c === 'monthly' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      )}
      <div className="text-sm">
        <span className="font-mono">{plan.label}</span>
        {plan.note && <span className="ml-2 text-[0.75rem]" style={{ color: 'var(--text-on-ink-dim)' }}>{plan.note}</span>}
      </div>
      <SubscribeButton key={plan.priceId} token={token} priceId={plan.priceId} sandbox={sandbox} email={email} userId={userId} />
    </div>
  );
}
