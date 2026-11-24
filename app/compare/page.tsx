import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { getAllStories, type Story } from '@/lib/stories';
import { ACTORS, COUNTRIES, SYSTEMS, THEMES, getLensEntity, storiesFor } from '@/lib/lens';
import { compareStories } from '@/lib/compare';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Compare | Chanakya Lens', robots: { index: false, follow: false } };

const OPTIONS = [...COUNTRIES, ...SYSTEMS, ...ACTORS, ...THEMES];

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ a?: string; b?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/account/login');
  if (!membershipVisibleTo(user.email)) notFound();

  const { a, b } = await searchParams;
  const ea = a ? getLensEntity(a) : undefined;
  const eb = b ? getLensEntity(b) : undefined;
  const stories = ea && eb ? await getAllStories() : [];
  const cmp = ea && eb ? compareStories(storiesFor(ea, stories), storiesFor(eb, stories)) : null;

  const select = (name: 'a' | 'b', value?: string) => (
    <select name={name} defaultValue={value ?? ''} className="w-full rounded-sm border px-3 py-2 bg-transparent text-sm" style={{ borderColor: 'var(--border)' }}>
      <option value="">Choose…</option>
      {OPTIONS.map((o) => (
        <option key={o.slug} value={o.slug}>{o.name}</option>
      ))}
    </select>
  );

  return (
    <>
      <NavDrawer />
      <div className="max-w-3xl mx-auto px-5 pt-7 pb-16">
        <Link href="/account" className="font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>← Your account</Link>
        <h1 className="font-display text-3xl font-bold mt-4 mb-2">Compare</h1>
        <p className="text-[0.95rem] mb-5" style={{ color: 'var(--text-body)' }}>Pick two countries, places or actors to see the stories they share and where they differ.</p>
        <form className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 mb-8">
          {select('a', a)}
          {select('b', b)}
          <button className="px-5 py-2 text-sm font-semibold text-white rounded-sm" style={{ background: '#0E7080' }}>Compare</button>
        </form>
        {cmp && ea && eb && (
          <div className="space-y-8">
            <Column title={`On both (${cmp.both.length})`} list={cmp.both} />
            <div className="grid md:grid-cols-2 gap-6">
              <Column title={`Only ${ea.name} (${cmp.onlyA.length})`} list={cmp.onlyA} />
              <Column title={`Only ${eb.name} (${cmp.onlyB.length})`} list={cmp.onlyB} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Column({ title, list }: { title: string; list: Story[] }) {
  return (
    <section>
      <h2 className="font-mono text-[0.7rem] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-soft)' }}>{title}</h2>
      {list.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>None.</p>
      ) : (
        <ul className="space-y-2">
          {list.slice(0, 8).map((s) => (
            <li key={s.slug}>
              <Link href={`/story/${s.slug}`} className="block rounded-sm border p-3 text-[0.88rem] leading-snug hover:opacity-80" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                {s.headline}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
