import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { RedeemForm } from './RedeemForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Redeem a Lens+ gift | Chanakya Lens', robots: { index: false, follow: false } };

export default async function RedeemPage() {
  const user = await getSessionUser();
  if (!membershipVisibleTo(user?.email)) notFound();
  if (!user) redirect('/account/login');
  return (
    <>
      <NavDrawer />
      <main className="max-w-md mx-auto px-5 pt-12 pb-20">
        <h1 className="font-display font-extrabold text-4xl text-center mb-2">Redeem your gift</h1>
        <p className="text-[0.95rem] text-center mb-6" style={{ color: 'var(--text-body)' }}>Enter the code from your email to add a year of Lens+ to {user.email}.</p>
        <RedeemForm />
        <p className="text-[0.75rem] text-center mt-6" style={{ color: 'var(--text-on-ink-dim)' }}>
          Want to buy one? <Link href="/gift" className="underline">Gift Lens+</Link>
        </p>
      </main>
    </>
  );
}
