import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { DispatchBody } from '@/components/DispatchBody';
import { getSessionUser } from '@/lib/supabase-user';
import { isOwnerEmail } from '@/lib/memberAccess';
import { dispatchAccess, getDispatch } from '@/lib/dispatches';
import { parseBlocks, previewBlocks } from '@/lib/miniMarkdown';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDispatch(slug);
  return d ? { title: `${d.title} | Dispatches | Chanakya Lens`, description: d.summary } : {};
}

export default async function DispatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  const access = await dispatchAccess(user);
  if (access === 'hidden') notFound();
  // The owner can open an unpublished draft to preview it.
  const d = await getDispatch(slug, { includeDrafts: isOwnerEmail(user?.email) });
  if (!d) notFound();

  const blocks = parseBlocks(d.body);
  const shown = access === 'allowed' ? blocks : previewBlocks(blocks);

  return (
    <>
      <NavDrawer />
      <main className="max-w-2xl mx-auto px-5 pt-8 pb-20">
        <Link href="/dispatches" className="font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>← Dispatches</Link>
        <div className="font-mono text-[0.6875rem] uppercase tracking-wide mt-5 mb-2" style={{ color: 'var(--brand-soft)' }}>
          {d.theme && `${d.theme} · `}{d.publishedAt ? new Date(d.publishedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Draft'}
        </div>
        <h1 className="font-display font-extrabold text-4xl leading-tight mb-3">{d.title}</h1>
        <p className="text-[1.05rem] leading-relaxed mb-6" style={{ color: 'var(--text-body)' }}>{d.summary}</p>
        {d.heroUrl && /^https:\/\//.test(d.heroUrl) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.heroUrl} alt="" className="w-full rounded-sm border mb-8" style={{ borderColor: 'var(--border)' }} />
        )}
        <DispatchBody blocks={shown} />
        {access !== 'allowed' && blocks.length > shown.length && (
          <div className="mt-10 rounded-sm border p-6 text-center" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
            <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-soft)' }}>Lens+ members</div>
            <h2 className="font-display font-extrabold text-2xl mb-2">Read the whole Dispatch</h2>
            <p className="text-[0.92rem] max-w-md mx-auto mb-5" style={{ color: 'var(--text-body)' }}>The rest of this Dispatch, with its maps and charts, is for Lens+ members. Every story on the site stays free.</p>
            <Link href="/membership" className="inline-block px-6 py-3 text-sm font-semibold rounded-sm" style={{ background: '#0E7080', color: '#fff' }}>Upgrade to Lens+</Link>
          </div>
        )}
      </main>
    </>
  );
}
