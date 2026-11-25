import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { dispatchAccess, listDispatches } from '@/lib/dispatches';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Dispatches | Chanakya Lens', description: 'Monthly visual deep-dives on one theme, for Lens+ members.' };

export default async function DispatchesPage() {
  const user = await getSessionUser();
  const access = await dispatchAccess(user);
  if (access === 'hidden') notFound();
  const items = await listDispatches();

  return (
    <>
      <NavDrawer />
      <main className="max-w-3xl mx-auto px-5 pt-8 pb-20">
        <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-soft)' }}>Lens+</div>
        <h1 className="font-display font-extrabold text-4xl mb-2">Dispatches</h1>
        <p className="text-[1rem] leading-relaxed mb-8" style={{ color: 'var(--text-body)' }}>
          One theme, once a month, explained in depth with maps and charts. Everyone can read the opening; Lens+ members get the whole thing.
        </p>
        {items.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>The first Dispatch is on its way.</p>
        ) : (
          <div className="space-y-4">
            {items.map((d) => (
              <Link key={d.slug} href={`/dispatches/${d.slug}`} className="block rounded-sm border p-5 hover:opacity-90" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                <div className="font-mono text-[0.6875rem] uppercase tracking-wide mb-1" style={{ color: 'var(--text-on-ink-dim)' }}>
                  {d.theme && `${d.theme} · `}{d.publishedAt ? new Date(d.publishedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Draft'}
                </div>
                <div className="font-display font-bold text-xl leading-snug mb-1">{d.title}</div>
                <p className="text-[0.9rem] leading-snug" style={{ color: 'var(--text-body)' }}>{d.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
