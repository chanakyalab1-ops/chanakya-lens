import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { pushConfigured } from '@/lib/push';
import { KeyGenerator } from './KeyGenerator';

export const dynamic = 'force-dynamic';

export default async function PushAdminPage() {
  let subscribers: number | null = null;
  try {
    const { count, error } = await supabaseServer().from('push_subscriptions').select('*', { count: 'exact', head: true });
    subscribers = error ? null : count;
  } catch {
    subscribers = null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-3xl font-extrabold">Notifications</h1>
        <Link href="/admin" className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>← Admin</Link>
      </div>

      <div className="border p-4 mb-6 text-sm space-y-1" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
        <div>Status: <b>{pushConfigured() ? 'On (keys are set)' : 'Off (no keys yet)'}</b></div>
        <div>Subscribers: <b>{subscribers === null ? 'table not created yet' : subscribers}</b></div>
        <div style={{ color: 'var(--text-on-ink-dim)' }}>Alerts go out automatically when you publish a story, at most 3 a day per reader. Use &ldquo;Alert followers of this story&rdquo; in Manage stories to announce an update.</div>
      </div>

      <h2 className="font-display font-bold text-lg mb-2" style={{ color: 'var(--brand-soft)' }}>Sending keys</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-body)' }}>
        Make a key pair once and add it to Vercel. Until both keys are in place, the bell is hidden from readers and nothing is sent.
      </p>
      <KeyGenerator />
    </div>
  );
}
