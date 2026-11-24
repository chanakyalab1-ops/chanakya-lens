import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { supabaseServer } from '@/lib/supabase-server';
import { getShelf } from '@/lib/userShelf';
import { SavedList } from './SavedList';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Saved stories | Chanakya Lens', robots: { index: false, follow: false } };

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect('/account/login');
  if (!membershipVisibleTo(user.email)) notFound();

  const saved = await getShelf(user.id);
  const { data } = saved.length ? await supabaseServer().from('stories').select('slug, headline, category').in('slug', saved.map((s) => s.slug)) : { data: [] };
  const bySlug = new Map(((data ?? []) as { slug: string; headline: string; category: string }[]).map((s) => [s.slug, s]));
  const items = saved.filter((s) => bySlug.has(s.slug)).map((s) => bySlug.get(s.slug)!);

  return (
    <>
      <NavDrawer />
      <div className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <Link href="/account" className="font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>
          ← Your account
        </Link>
        <div className="flex items-end justify-between gap-3 mt-4 mb-5">
          <h1 className="font-display text-3xl font-bold">Saved stories</h1>
          {items.length > 0 && (
            <a href="/api/saved/export" download className="font-mono text-[0.6875rem] uppercase tracking-wide underline" style={{ color: 'var(--text-on-ink-dim)' }}>Download CSV</a>
          )}
        </div>
        <SavedList initial={items} />
      </div>
    </>
  );
}
