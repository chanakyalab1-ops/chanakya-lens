import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import NavDrawer from '@/components/NavDrawer';
import { SignOutButton } from './SignOutButton';
import { ManageButton } from '@/components/MembershipButtons';
import { paddleConfigured } from '@/lib/paddle';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { getMembership, isActiveMember } from '@/lib/membership';

async function getSupabaseServerReader() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only in this context — session refresh is handled by proxy.ts
        },
      },
    },
  );
}

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ membership?: string }> }) {
  const { membership: justJoined } = await searchParams;
  const supabase = await getSupabaseServerReader();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/account/login');
  }

  const membership = await getMembership(user.id);
  const member = isActiveMember(membership);

  return (
    <>
      <NavDrawer />
      <div className="max-w-xl mx-auto px-5 pt-7 pb-16">
        <h1 className="font-display text-2xl font-bold mb-1">Your account</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-on-ink-dim)' }}>{user.email}</p>

        {membershipVisibleTo(user.email) && (member || paddleConfigured() || justJoined) && (
          <section className="mb-8">
            <h2 className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-on-ink-dim)' }}>
              Membership
            </h2>
            {member && membership ? (
              <div className="rounded-sm border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                <div className="text-sm font-semibold">Lens+</div>
                <div className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>
                  {membership.cancelAtPeriodEnd ? 'Ends' : 'Renews'}{' '}
                  {membership.currentPeriodEnd ? new Date(membership.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </div>
                <ManageButton />
              </div>
            ) : justJoined ? (
              <p className="text-sm" style={{ color: 'var(--text-on-ink-dim)' }}>
                Thank you. Your membership can take a few seconds to appear; refresh this page shortly.
              </p>
            ) : (
              <p className="text-sm">
                <Link href="/membership" className="underline">Upgrade to Lens+</Link>
              </p>
            )}
          </section>
        )}

        {membershipVisibleTo(user.email) && (
          <>
        <section className="mb-8">
          <h2 className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-on-ink-dim)' }}>
            Watchlist
          </h2>
          <p className="text-sm">
            <Link href="/account/watchlist" className="underline">Choose what you watch</Link>
            <span style={{ color: 'var(--text-on-ink-dim)' }}> to build your My Lens tab.</span>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-on-ink-dim)' }}>
            Shelf
          </h2>
          <p className="text-sm">
            <Link href="/account/shelf" className="underline">Open your Shelf</Link>
            <span style={{ color: 'var(--text-on-ink-dim)' }}> for the stories you kept.</span>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-on-ink-dim)' }}>
            Reading Map
          </h2>
          <p className="text-sm">
            <Link href="/account/reading" className="underline">See what you read</Link>
            <span style={{ color: 'var(--text-on-ink-dim)' }}> and which countries you miss.</span>
          </p>
        </section>

          </>
        )}

        <SignOutButton />
      </div>
    </>
  );
}