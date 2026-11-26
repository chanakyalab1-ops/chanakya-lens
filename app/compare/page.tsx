import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { paidAccess } from '@/lib/entitlements';
import { UpgradeNotice } from '@/components/UpgradeNotice';
import { getAllStories, type Story } from '@/lib/stories';
import { ACTORS, COUNTRIES, SYSTEMS, THEMES, getLensEntity, storiesFor, type LensEntity } from '@/lib/lens';
import { compareStories, overlapSentence, summarizeSide, type SideSummary } from '@/lib/compare';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Compare | Chanakya Lens', robots: { index: false, follow: false } };

const OPTIONS = [...COUNTRIES, ...SYSTEMS, ...ACTORS, ...THEMES];

// Starting points shown before anything is picked. Pairs with an unknown slug are dropped.
const SUGGESTED = ([
  ['india', 'china'],
  ['united-states', 'china'],
  ['india', 'india-us-trade'],
  ['red-sea', 'tariffs-and-trade'],
  ['opec', 'united-states'],
] as [string, string][]).filter(([x, y]) => getLensEntity(x) && getLensEntity(y));

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ a?: string; b?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/account/login');
  const access = await paidAccess(user);
  if (access === 'hidden') notFound();

  if (access === 'locked') {
    return (
      <>
        <NavDrawer />
        <div className="max-w-2xl mx-auto px-5 pt-7 pb-16">
          <Link href="/account" className="font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>← Your account</Link>
          <h1 className="font-display text-3xl font-bold mt-4 mb-5">Compare</h1>
          <UpgradeNotice feature="compare" icon="compare" />
        </div>
      </>
    );
  }

  const { a, b } = await searchParams;
  const ea = a ? getLensEntity(a) : undefined;
  const eb = b ? getLensEntity(b) : undefined;
  const stories = ea && eb ? await getAllStories() : [];
  const listA = ea ? storiesFor(ea, stories) : [];
  const listB = eb ? storiesFor(eb, stories) : [];
  const cmp = ea && eb ? compareStories(listA, listB) : null;
  const sumA = summarizeSide(listA);
  const sumB = summarizeSide(listB);

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
        <p className="text-[0.95rem] mb-5" style={{ color: 'var(--text-body)' }}>Pick two countries, places, actors or themes. We show how much we cover each, which stories they share, and where they differ.</p>
        <form className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 mb-8">
          {select('a', a)}
          {select('b', b)}
          <button className="px-5 py-2 text-sm font-semibold text-white rounded-sm" style={{ background: '#0E7080' }}>Compare</button>
        </form>
        {!cmp && (
          <section>
            <h2 className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-soft)' }}>Try one of these</h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map(([x, y]) => (
                <Link key={`${x}-${y}`} href={`/compare?a=${x}&b=${y}`} className="rounded-full border px-3 py-1.5 text-[0.85rem] hover:opacity-80" style={{ borderColor: 'var(--border)' }}>
                  {getLensEntity(x)!.name} vs {getLensEntity(y)!.name}
                </Link>
              ))}
            </div>
          </section>
        )}
        {cmp && ea && eb && (
          <div className="space-y-8">
            <p className="text-[1rem] leading-relaxed" style={{ color: 'var(--text-body)' }}>{overlapSentence(ea.name, eb.name, cmp)}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <SideCard entity={ea} sum={sumA} />
              <SideCard entity={eb} sum={sumB} />
            </div>
            <Column title={`On both (${cmp.both.length})`} list={cmp.both} />
            <div className="grid md:grid-cols-2 gap-6">
              <Column title={`Only ${ea.name} (${cmp.onlyA.length})`} list={cmp.onlyA} more={`/lens/${ea.slug}`} />
              <Column title={`Only ${eb.name} (${cmp.onlyB.length})`} list={cmp.onlyB} more={`/lens/${eb.slug}`} />
            </div>
            <p className="text-[0.75rem] leading-snug" style={{ color: 'var(--text-on-ink-dim)' }}>
              Counts cover stories we have published, matched on their headline, summary and the countries they are about. A story we have not written yet will not appear here.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'n/a';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="font-display text-xl font-bold leading-none">{value}</div>
      <div className="font-mono text-[0.625rem] uppercase tracking-wide mt-1" style={{ color: 'var(--text-on-ink-dim)' }}>{label}</div>
    </div>
  );
}

function SideCard({ entity, sum }: { entity: LensEntity; sum: SideSummary }) {
  const list = (rows: [string, number][]) => (rows.length ? rows.map(([n, c]) => `${n} (${c})`).join(', ') : 'n/a');
  const dt = 'inline font-mono text-[0.625rem] uppercase tracking-wide mr-2';
  return (
    <section className="rounded-sm border p-4" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
      <h2 className="font-display text-xl font-bold">
        <Link href={`/lens/${entity.slug}`} className="hover:opacity-80">{entity.name}</Link>
      </h2>
      {entity.tagline && <p className="text-[0.85rem] mt-1" style={{ color: 'var(--text-body)' }}>{entity.tagline}</p>}
      {entity.whyItMatters && <p className="text-[0.8rem] mt-2 leading-snug" style={{ color: 'var(--text-on-ink-dim)' }}>{entity.whyItMatters}</p>}
      <div className="grid grid-cols-4 gap-3 mt-4">
        <Stat label="Stories" value={sum.total} />
        <Stat label="Last 30d" value={sum.last30} />
        <Stat label="Developing" value={sum.developing} />
        <Stat label="Avg sources" value={sum.avgSources ?? 'n/a'} />
      </div>
      <dl className="mt-4 space-y-1.5 text-[0.8rem]" style={{ color: 'var(--text-body)' }}>
        <div><dt className={dt} style={{ color: 'var(--text-on-ink-dim)' }}>Mostly</dt><dd className="inline">{list(sum.topCategories)}</dd></div>
        <div><dt className={dt} style={{ color: 'var(--text-on-ink-dim)' }}>Sources from</dt><dd className="inline">{list(sum.topSourceCountries)}</dd></div>
        <div><dt className={dt} style={{ color: 'var(--text-on-ink-dim)' }}>Latest</dt><dd className="inline">{fmtDate(sum.newest)}</dd></div>
      </dl>
    </section>
  );
}

function Column({ title, list, more }: { title: string; list: Story[]; more?: string }) {
  return (
    <section>
      <h2 className="font-mono text-[0.7rem] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-soft)' }}>{title}</h2>
      {list.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>None.</p>
      ) : (
        <ul className="space-y-2">
          {list.slice(0, 8).map((s) => (
            <li key={s.slug}>
              <Link href={`/story/${s.slug}`} className="block rounded-sm border p-3 hover:opacity-80" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                <div className="font-mono text-[0.625rem] uppercase tracking-wide mb-1" style={{ color: 'var(--text-on-ink-dim)' }}>
                  {s.category} · {fmtDate(s.publishedAt)}{s.status === 'developing' ? ' · Developing' : ''}
                </div>
                <div className="text-[0.88rem] leading-snug font-semibold">{s.headline}</div>
                {s.dek && <div className="text-[0.78rem] leading-snug mt-1 line-clamp-2" style={{ color: 'var(--text-on-ink-dim)' }}>{s.dek}</div>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {more && list.length > 8 && (
        <Link href={more} className="inline-block mt-3 font-mono text-[0.6875rem] uppercase tracking-wide underline" style={{ color: 'var(--brand-soft)' }}>
          See all {list.length}
        </Link>
      )}
    </section>
  );
}
