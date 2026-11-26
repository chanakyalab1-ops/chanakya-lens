import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { ResendForm } from './ResendForm';

export const dynamic = 'force-dynamic';

type Row = { code: string; buyer_email: string; created_at: string; redeemed_at: string | null };

export default async function AdminGiftsPage() {
  const { data, error } = await supabaseServer().from('gift_codes').select('code, buyer_email, created_at, redeemed_at').order('created_at', { ascending: false }).limit(100);
  const rows = (data ?? []) as Row[];
  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: 'var(--text-on-ink)' }}>Gift codes</h1>
        <Link href="/admin" className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>← Admin</Link>
      </div>
      <p className="text-[0.85rem] mb-6" style={{ color: 'var(--text-body)' }}>
        Every gift payment makes a code. If a buyer did not get their email, send it again from here. A code appears here only after Paddle&apos;s webhook has reached the site, so an empty list after a payment means the webhook did not arrive.
      </p>
      {error ? (
        <p className="text-sm" style={{ color: 'var(--developing)' }}>Could not read gift codes. Has supabase/gifts.sql been run?</p>
      ) : rows.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>No gift codes yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.code} className="rounded-sm border p-3" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <span className="font-mono text-base tracking-wider">{r.code}</span>
                <span className="font-mono text-[0.6875rem] uppercase" style={{ color: r.redeemed_at ? 'var(--possible)' : 'var(--text-on-ink-dim)' }}>{r.redeemed_at ? 'Redeemed' : 'Not redeemed'}</span>
              </div>
              <div className="text-xs mb-2" style={{ color: 'var(--text-on-ink-dim)' }}>
                Bought {new Date(r.created_at).toLocaleString('en-GB')} · buyer: {r.buyer_email || 'unknown'}
              </div>
              {!r.redeemed_at && <ResendForm code={r.code} defaultEmail={r.buyer_email} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
