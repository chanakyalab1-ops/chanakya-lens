import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import NavDrawer from '@/components/NavDrawer';
import { SignOutButton } from './SignOutButton';
import { Icon } from '@/components/Icon';
import { ReadingSize } from '@/components/ReadingSize';
import { ManageButton } from '@/components/MembershipButtons';
import { paddleConfigured } from '@/lib/paddle';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { getMembership, isActiveMember } from '@/lib/membership';
import { getUserInterests } from '@/lib/userInterests';
import { getShelf } from '@/lib/userShelf';

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

  const tools = membershipVisibleTo(user.email);
  const [membership, watching, saved] = await Promise.all([
    getMembership(user.id),
    tools ? getUserInterests(user.id) : Promise.resolve([]),
    tools ? getShelf(user.id) : Promise.resolve([]),
  ]);
  const member = isActiveMember(membership);
  const showMembership = tools && (member || paddleConfigured() || justJoined);
  const initial = (user.email ?? '?').charAt(0).toUpperCase();
  const renewal = membership?.currentPeriodEnd
    ? new Date(membership.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const cards = [
    { href: '/account/watchlist', icon: 'target', title: 'Watchlist', text: 'Countries, chokepoints, actors and topics you follow. They build your My Lens tab.', count: watching.length, unit: 'watched' },
    { href: '/account/saved', icon: 'bookmark', title: 'Saved stories', text: 'Stories you saved to read later.', count: saved.length, unit: 'saved' },
    { href: '/account/reading', icon: 'compass', title: 'Reading Map', text: 'What you read, your reading streak, and which countries you keep missing.', count: null, unit: '' },
    { href: '/ask', icon: 'chat', title: 'Ask the Lens', text: 'Ask a question and get an answer from our own stories, with sources.', count: null, unit: '' },
    { href: '/compare', icon: 'compare', title: 'Compare', text: 'Pick two countries, places or actors and see what they share.', count: null, unit: '' },
  ];

  return (
    <>
      <NavDrawer />
      <div className="max-w-2xl mx-auto px-5 pt-8 pb-20">
        <header className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 shrink-0 rounded-full flex items-center justify-center font-display text-2xl font-extrabold text-white" style={{ background: '#0E7080' }} aria-hidden>
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold leading-tight">Your account</h1>
            <p className="text-sm truncate" style={{ color: 'var(--text-on-ink-dim)' }}>{user.email}</p>
          </div>
          {showMembership && (
            <span
              className="ml-auto shrink-0 font-mono text-[0.6875rem] uppercase tracking-widest rounded-full px-3 py-1.5"
              style={member ? { background: '#0E7080', color: '#fff' } : { border: '1px solid var(--border)', color: 'var(--text-on-ink-dim)' }}
            >
              {member ? 'Lens+' : 'Free plan'}
            </span>
          )}
        </header>

        {showMembership && (
          <section className="mb-8">
            {member && membership ? (
              <div className="rounded-sm p-5 text-white" style={{ background: 'linear-gradient(135deg, #0E7080 0%, #0A4F5B 100%)' }}>
                <div className="font-mono text-[0.6875rem] uppercase tracking-widest opacity-80 mb-1">Membership</div>
                <div className="font-display text-xl font-extrabold mb-1">You are a Lens+ member</div>
                <p className="text-sm opacity-90 mb-4">
                  {membership.cancelAtPeriodEnd ? 'Your membership ends' : 'Renews'} {renewal}.
                </p>
                <div className="[&_button]:!text-white [&_button]:!border-white/70 [&_button]:!bg-white/10">
                  <ManageButton />
                </div>
              </div>
            ) : justJoined ? (
              <div className="rounded-sm border p-5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                Thank you. Your membership can take a few seconds to appear; refresh this page shortly.
              </div>
            ) : (
              <div className="rounded-sm border p-5 flex flex-wrap items-center justify-between gap-4" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                <div className="min-w-0">
                  <div className="font-display text-lg font-extrabold">Go further with Lens+</div>
                  <p className="text-sm" style={{ color: 'var(--text-body)' }}>An unlimited Watchlist, a My Lens feed and more tools as we build them.</p>
                </div>
                <Link href="/membership" className="shrink-0 px-5 py-2.5 text-sm font-semibold text-white rounded-sm" style={{ background: '#0E7080' }}>
                  Upgrade to Lens+
                </Link>
              </div>
            )}
          </section>
        )}

        {tools && (
          <section className="mb-10">
            <h2 className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-soft)' }}>Your tools</h2>
            <div className="space-y-3">
              {cards.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group flex items-center gap-4 rounded-sm border p-4 transition-colors hover:border-[#0E7080]"
                  style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}
                >
                  <span className="h-11 w-11 shrink-0 rounded-sm flex items-center justify-center" style={{ background: 'var(--ink)', color: '#0E7080' }} aria-hidden><Icon name={c.icon} size={22} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-display font-bold text-[1.05rem]">{c.title}</span>
                      {c.count !== null && c.count > 0 && (
                        <span className="font-mono text-[0.6875rem] uppercase tracking-wide rounded-full px-2 py-0.5" style={{ background: '#0E7080', color: '#fff' }}>
                          {c.count} {c.unit}
                        </span>
                      )}
                    </span>
                    <span className="block text-[0.84rem] leading-snug" style={{ color: 'var(--text-on-ink-dim)' }}>{c.text}</span>
                  </span>
                  <span className="shrink-0 text-lg transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-on-ink-dim)' }} aria-hidden>→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {tools && (
          <section className="mb-10">
            <h2 className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-soft)' }}>Reading size</h2>
            <ReadingSize />
          </section>
        )}

        <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <SignOutButton />
        </div>
      </div>
    </>
  );
}
