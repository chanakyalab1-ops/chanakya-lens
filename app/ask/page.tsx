import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { paidAccess } from '@/lib/entitlements';
import { UpgradeNotice } from '@/components/UpgradeNotice';
import { askLimitsFor } from '@/lib/ask';
import { AskForm } from './AskForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Ask the Lens | Chanakya Lens', robots: { index: false, follow: false } };

export default async function AskPage() {
  const user = await getSessionUser();
  if (!user) redirect('/account/login');
  const access = await paidAccess(user);
  if (access === 'hidden') notFound();
  return (
    <>
      <NavDrawer />
      <div className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <Link href="/account" className="font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>← Your account</Link>
        <h1 className="font-display text-3xl font-bold mt-4 mb-2">Ask the Lens</h1>
        <p className="text-[0.95rem] leading-relaxed mb-6" style={{ color: 'var(--text-body)' }}>
          Ask a question and get an answer built only from our own stories, with the stories it came from. If we have not covered it, it says so.
        </p>
        <AskForm limit={askLimitsFor(access === 'locked' ? 'free' : 'member').perUser} />
        {access === 'locked' && (
          <div className="mt-8">
            <UpgradeNotice feature="ask" icon="chat" heading="Get 5 questions a day with Lens+" />
          </div>
        )}
      </div>
    </>
  );
}
