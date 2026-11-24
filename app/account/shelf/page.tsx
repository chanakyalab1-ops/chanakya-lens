import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { supabaseServer } from '@/lib/supabase-server';
import { getShelf } from '@/lib/userShelf';
import { getMembership, isActiveMember } from '@/lib/membership';
import { SHELF_FREE_LIMIT } from '@/lib/shelf';
import { ShelfList } from './ShelfList';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your Shelf | Chanakya Lens', robots: { index: false, follow: false } };

export default async function ShelfPage() {
  const user = await getSessionUser();
  if (!user) redirect('/account/login');

  const [shelf, membership] = await Promise.all([getShelf(user.id), getMembership(user.id)]);
  const { data } = shelf.length
    ? await supabaseServer().from('stories').select('slug, headline, category').in('slug', shelf.map((s) => s.slug))
    : { data: [] };
  const bySlug = new Map(((data ?? []) as { slug: string; headline: string; category: string }[]).map((s) => [s.slug, s]));
  const items = shelf
    .filter((s) => bySlug.has(s.slug))
    .map((s) => ({ slug: s.slug, note: s.note, headline: bySlug.get(s.slug)!.headline, category: bySlug.get(s.slug)!.category }));
  const limited = process.env.MEMBERSHIP_PUBLIC === 'true' && !isActiveMember(membership);

  return (
    <>
      <NavDrawer />
      <div className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <Link href="/account" className="font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>
          ← Your account
        </Link>
        <h1 className="font-display text-3xl font-bold mt-4 mb-2">Your Shelf</h1>
        <p className="text-[0.95rem] leading-relaxed mb-2" style={{ color: 'var(--text-body)' }}>
          Stories you keep, with a private note on why.
          {limited && ` Free readers can keep ${SHELF_FREE_LIMIT}; Lens+ is unlimited.`}
        </p>
        {limited && (
          <p className="font-mono text-[0.7rem] mb-5" style={{ color: 'var(--text-on-ink-dim)' }}>
            {items.length} of {SHELF_FREE_LIMIT} kept. <Link href="/membership" className="underline">Upgrade to Lens+</Link>
          </p>
        )}
        {items.length === 0 ? (
          <p className="text-sm mt-4" style={{ color: 'var(--text-on-ink-dim)' }}>
            Nothing on your Shelf yet. Tap <b>Keep</b> on any story to add it.
          </p>
        ) : (
          <ShelfList initial={items} />
        )}
      </div>
    </>
  );
}
