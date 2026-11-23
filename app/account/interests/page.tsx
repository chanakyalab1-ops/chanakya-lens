import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { getSessionUser } from '@/lib/supabase-user';
import { getUserInterests } from '@/lib/userInterests';
import { getAllStories } from '@/lib/stories';
import { ACTORS, COUNTRIES, SYSTEMS, THEMES, isThinCountry, storiesFor } from '@/lib/lens';
import { CATEGORY_OPTIONS, FREE_INTEREST_LIMIT } from '@/lib/interests';
import { getMembership, isActiveMember } from '@/lib/membership';
import { InterestsPicker } from './InterestsPicker';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Your interests | Chanakya Lens', robots: { index: false, follow: false } };

export default async function InterestsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/account/login');

  const [stories, interests, membership] = await Promise.all([getAllStories(), getUserInterests(user.id), getMembership(user.id)]);

  const countries = COUNTRIES.filter((c) => !isThinCountry(c, storiesFor(c, stories).length));
  const lens = (list: typeof SYSTEMS) => list.map((e) => ({ kind: 'lens' as const, slug: e.slug, name: e.name }));

  const groups = [
    { title: 'Topics', options: CATEGORY_OPTIONS.map((c) => ({ kind: 'category' as const, slug: c, name: c })) },
    { title: 'Countries', options: lens(countries) },
    { title: 'Strategic places and systems', options: lens(SYSTEMS) },
    { title: 'Actors and themes', options: [...lens(ACTORS), ...lens(THEMES)] },
  ];

  return (
    <>
      <NavDrawer />
      <div className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <Link href="/account" className="font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>
          ← Your account
        </Link>
        <h1 className="font-display text-3xl font-bold mt-4 mb-2">Your interests</h1>
        <p className="text-[0.95rem] leading-relaxed mb-5" style={{ color: 'var(--text-body)' }}>
          Follow what matters to you. The <b>For you</b> tab on the homepage is built from these.
        </p>
        <InterestsPicker
          groups={groups}
          initial={interests.map((i) => `${i.kind}:${i.slug}`)}
          freeLimit={FREE_INTEREST_LIMIT}
          limitApplies={process.env.MEMBERSHIP_PUBLIC === 'true'}
          isMember={isActiveMember(membership)}
        />
      </div>
    </>
  );
}
