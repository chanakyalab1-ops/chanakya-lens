import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { Icon } from '@/components/Icon';
import { GiftButton } from '@/components/GiftButton';
import { GroupPlanForm } from '@/components/GroupPlanForm';
import { getSessionUser } from '@/lib/supabase-user';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { isSandboxToken } from '@/lib/paddle';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Gift Lens+ | Chanakya Lens', description: 'Give a year of Chanakya Lens+ to a friend, a student or a colleague, or ask for a group plan.' };

export default async function GiftPage({ searchParams }: { searchParams: Promise<{ thanks?: string }> }) {
  const { thanks } = await searchParams;
  const user = await getSessionUser();
  // Hidden from everyone but the owner until MEMBERSHIP_PUBLIC=true.
  if (!membershipVisibleTo(user?.email)) notFound();

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '';
  const giftPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GIFT ?? '';
  const giftLabel = process.env.GIFT_PRICE_LABEL ?? '1 year of Lens+';

  return (
    <>
      <NavDrawer />
      <main className="max-w-2xl mx-auto px-5 pt-10 pb-20">
        <section className="text-center mb-10">
          <div className="flex justify-center mb-3" style={{ color: '#0E7080' }}><Icon name="shield" size={34} /></div>
          <h1 className="font-display font-extrabold text-5xl leading-[1.02] mb-3">Gift <span style={{ color: 'var(--brand-soft)' }}>Lens+</span></h1>
          <p className="text-[1.05rem] leading-relaxed max-w-lg mx-auto" style={{ color: 'var(--text-body)' }}>
            Give someone a year of Lens+: an unlimited Watchlist, a digest built around it, Ask the Lens, the Reading Map and more. Every story stays free for them too.
          </p>
        </section>

        {thanks && (
          <div className="rounded-sm border p-5 mb-8 text-center" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
            <div className="font-display font-extrabold text-xl mb-1">Thank you. Your gift is on its way.</div>
            <p className="text-sm" style={{ color: 'var(--text-body)' }}>We are emailing the gift code to the address you paid with. It can take a minute. Check your spam folder if it does not arrive.</p>
          </div>
        )}

        <section className="rounded-sm border p-6 mb-10" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
          <h2 className="font-display font-bold text-2xl mb-3">How it works</h2>
          <ol className="space-y-2 text-[0.95rem] mb-6" style={{ color: 'var(--text-body)' }}>
            <li><b>1.</b> Pay once. There is no subscription and no renewal.</li>
            <li><b>2.</b> We email you a gift code straight away.</li>
            <li><b>3.</b> Send the code to your friend. They sign in at <Link href="/redeem" className="underline">chanakyalens.com/redeem</Link> and enter it.</li>
          </ol>
          {giftPriceId && token ? (
            <GiftButton token={token} priceId={giftPriceId} sandbox={isSandboxToken(token)} label={`Buy a gift: ${giftLabel}`} />
          ) : (
            <p className="text-sm text-center" style={{ color: 'var(--text-on-ink-dim)' }}>Gifts open soon.</p>
          )}
          <p className="text-[0.75rem] mt-3 text-center" style={{ color: 'var(--text-on-ink-dim)' }}>Paid through Paddle, our payment partner. Each code works once.</p>
        </section>

        <section className="mb-4">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-2 text-center" style={{ color: 'var(--brand-soft)' }}>Group or classroom plan</h2>
          <p className="text-[0.9rem] text-center mb-5" style={{ color: 'var(--text-body)' }}>Giving Lens+ to a class, an office or a team? Tell us roughly how many people and we will send a quote.</p>
          <div className="max-w-lg mx-auto"><GroupPlanForm /></div>
        </section>
      </main>
    </>
  );
}
