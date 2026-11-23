import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import NavDrawer from '@/components/NavDrawer';
import { SignOutButton } from './SignOutButton';
import { ManageButton } from '@/components/MembershipButtons';
import { paddleConfigured } from '@/lib/paddle';
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

  const { data: saved } = await supabase
    .from('saved_stories')
    .select('story_slug, created_at, stories(headline, category)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const membership = await getMembership(user.id);
  const member = isActiveMember(membership);

  return (
    <>
      <NavDrawer />
      <div className="max-w-xl mx-auto px-5 pt-7 pb-16">
        <h1 className="font-display text-2xl font-bold mb-1">Your account</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-on-ink-dim)' }}>{user.email}</p>

        {(member || paddleConfigured() || justJoined) && (
          <section className="mb-8">
            <h2 className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-on-ink-dim)' }}>
              Membership
            </h2>
            {member && membership ? (
              <div className="rounded-sm border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                <div className="text-sm font-semibold">Strategist</div>
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
                <Link href="/membership" className="underline">Become a Strategist</Link>
              </p>
            )}
          </section>
        )}

        <h2 className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-on-ink-dim)' }}>
          Saved stories
        </h2>

        {saved && saved.length > 0 ? (
          <div className="space-y-2 mb-8">
            {saved.map((s) => (
              <Link
                key={s.story_slug}
                href={`/story/${s.story_slug}`}
                className="block rounded-sm border p-3"
                style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}
              >
                {/* @ts-expect-error — nested relation typing from Supabase */}
                <div className="font-mono text-[0.62rem] uppercase" style={{ color: 'var(--brand-soft)' }}>{s.stories?.category}</div>
                {/* @ts-expect-error — nested relation typing from Supabase */}
                <div className="text-sm font-semibold">{s.stories?.headline}</div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm mb-8" style={{ color: 'var(--text-on-ink-dim)' }}>
            Nothing saved yet — tap the bookmark icon on any story to save it here.
          </p>
        )}

        <SignOutButton />
      </div>
    </>
  );
}