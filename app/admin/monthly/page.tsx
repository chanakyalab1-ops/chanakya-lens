import Link from 'next/link';
import { getDispatch, listDispatches } from '@/lib/monthly';
import { DispatchEditor } from './DispatchEditor';
import { GenerateButton } from './GenerateButton';

export const dynamic = 'force-dynamic';

export default async function AdminDispatchesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [items, current] = await Promise.all([listDispatches({ includeDrafts: true }), edit && edit !== 'new' ? getDispatch(edit, { includeDrafts: true }) : Promise.resolve(null)]);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: 'var(--text-on-ink)' }}>Lens Monthly</h1>
        <Link href="/admin" className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>← Admin</Link>
      </div>
      <p className="text-[0.85rem] mb-6" style={{ color: 'var(--text-body)' }}>
        The monthly report for Lens+ members. Readers without Lens+ see the first three blocks and an upgrade prompt.
      </p>

      {edit ? (
        <>
          <Link href="/admin/monthly" className="inline-block mb-4 text-sm underline">← All reports</Link>
          <DispatchEditor key={edit} initial={current} />
        </>
      ) : (
        <>
          <GenerateButton />
          <Link href="/admin/monthly?edit=new" className="inline-block mb-5 px-4 py-2 text-sm font-medium rounded bg-[#C97B4A] text-[#0B1220]">New report</Link>
          {items.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>None yet. If this page errors on save, run supabase/lens-monthly.sql first.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((d) => (
                <li key={d.slug} className="flex items-center justify-between gap-3 rounded-sm border p-3" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                  <span>
                    <span className="font-semibold">{d.title}</span>
                    <span className="ml-2 font-mono text-[0.6875rem] uppercase" style={{ color: d.published ? 'var(--possible)' : 'var(--text-on-ink-dim)' }}>{d.published ? 'Published' : 'Draft'}</span>
                  </span>
                  <Link href={`/admin/monthly?edit=${d.slug}`} className="text-sm underline">Edit</Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
