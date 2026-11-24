import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import NavDrawer from '@/components/NavDrawer';
import { Icon } from '@/components/Icon';
import { getSessionUser } from '@/lib/supabase-user';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { paidAccess } from '@/lib/entitlements';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserInterests } from '@/lib/userInterests';
import { getShelf } from '@/lib/userShelf';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your tools | Chanakya Lens', robots: { index: false, follow: false } };

type Tool = { icon: string; name: string; text: string; how: string; href: string; cta: string; paid?: boolean };

const TOOLS: Tool[] = [
  { icon: 'target', name: 'Watchlist', text: 'Follow the countries, places, actors and topics you care about.', how: 'Free: up to 3. Lens+: unlimited.', href: '/account/watchlist', cta: 'Open your Watchlist' },
  { icon: 'target', name: 'My Lens feed', text: 'A homepage tab built from your Watchlist.', how: 'On the homepage, tap My Lens above the stories.', href: '/', cta: 'Go to the homepage' },
  { icon: 'bookmark', name: 'Save stories', text: 'Keep stories to read later.', how: 'Tap Save at the top of any story.', href: '/account/saved', cta: 'Open saved stories' },
  { icon: 'search', name: 'Focus filters', text: 'Hide stories you have read, or narrow by how certain the effect is, or by country.', how: 'The Focus bar sits above the homepage feed.', href: '/', cta: 'Go to the homepage' },
  { icon: 'offline', name: 'Offline reading', text: 'Saved stories open even without a connection.', how: 'Save a story while online, then read it anywhere.', href: '/account/saved', cta: 'Open saved stories' },
  { icon: 'link', name: 'Connected stories', text: 'See what else is happening on the same places, actors and themes.', how: 'At the bottom of every story, under Connected through.', href: '/', cta: 'Find a story' },
  { icon: 'chat', name: 'Ask the Lens', text: 'Ask a question and get an answer built only from our stories, with sources.', how: '5 questions a day.', href: '/ask', cta: 'Ask a question', paid: true },
  { icon: 'compare', name: 'Compare', text: 'Pick two countries, places or actors and see what they share.', how: 'Choose any two Lens pages.', href: '/compare', cta: 'Compare two', paid: true },
  { icon: 'compass', name: 'Reading Map', text: 'What you read, your streak, and which countries you keep missing.', how: 'Fills in as you read stories while signed in.', href: '/account/reading', cta: 'Open your map', paid: true },
  { icon: 'eye', name: 'Watch a story', text: 'An alert when one specific story is updated.', how: 'Tap Watch at the top of a story, and turn on the bell.', href: '/', cta: 'Find a story', paid: true },
  { icon: 'mail', name: 'Email me', text: 'Send any story to your inbox as a clean email.', how: 'Tap Email me at the top of a story.', href: '/', cta: 'Find a story', paid: true },
  { icon: 'mail', name: 'Watchlist digest', text: 'Your daily email leads with the stories on your Watchlist.', how: 'Needs the daily digest and a Watchlist.', href: '/digest', cta: 'Check your digest', paid: true },
];

export default async function ToolsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/account/login');
  if (!membershipVisibleTo(user.email)) notFound();

  const access = await paidAccess(user);
  const db = supabaseServer();
  const [watching, saved, reads] = await Promise.all([
    getUserInterests(user.id),
    getShelf(user.id),
    db.from('story_reads').select('slug', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);
  const steps = [
    { done: watching.length > 0, text: 'Add something to your Watchlist', href: '/account/watchlist' },
    { done: saved.length > 0, text: 'Save a story', href: '/' },
    { done: (reads.count ?? 0) >= 3, text: 'Read three stories to start your Reading Map', href: '/' },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <>
      <NavDrawer />
      <main className="max-w-3xl mx-auto px-5 pt-8 pb-20">
        <Link href="/account" className="font-mono text-[0.6875rem] uppercase tracking-wide hover:opacity-80" style={{ color: 'var(--text-on-ink-dim)' }}>← Your account</Link>
        <h1 className="font-display font-extrabold text-4xl mt-4 mb-2">Your tools</h1>
        <p className="text-[1rem] leading-relaxed mb-8" style={{ color: 'var(--text-body)' }}>
          Everything we have added for readers, in one place, with where to find each one.
        </p>

        <section className="rounded-sm border p-5 mb-10" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-display font-bold text-xl">Get started</h2>
            <span className="font-mono text-[0.6875rem] uppercase tracking-widest" style={{ color: 'var(--brand-soft)' }}>{doneCount} of {steps.length} done</span>
          </div>
          <ul className="space-y-2">
            {steps.map((s) => (
              <li key={s.text}>
                <Link href={s.href} className="flex items-center gap-3 text-[0.95rem] hover:opacity-80">
                  <span
                    aria-hidden
                    className="h-5 w-5 shrink-0 rounded-full border flex items-center justify-center text-[0.75rem]"
                    style={s.done ? { background: '#0E7080', borderColor: '#0E7080', color: '#fff' } : { borderColor: 'var(--border)' }}
                  >
                    {s.done ? '✓' : ''}
                  </span>
                  <span style={s.done ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>{s.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid sm:grid-cols-2 gap-3">
          {TOOLS.map((t) => {
            const locked = t.paid && access === 'locked';
            return (
              <div key={t.name} className="rounded-sm border p-4 flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span style={{ color: '#0E7080' }}><Icon name={t.icon} size={24} /></span>
                  <span
                    className="font-mono text-[0.6875rem] uppercase tracking-wide rounded-full px-2 py-0.5 border"
                    style={t.paid ? { borderColor: '#C97B4A', color: '#C97B4A' } : { borderColor: 'var(--border)', color: 'var(--text-on-ink-dim)' }}
                  >
                    {t.paid ? 'Lens+' : 'Free'}
                  </span>
                </div>
                <div className="font-display font-bold text-[1.1rem] mb-1">{t.name}</div>
                <p className="text-[0.86rem] leading-snug mb-2" style={{ color: 'var(--text-body)' }}>{t.text}</p>
                <p className="text-[0.78rem] mb-3" style={{ color: 'var(--text-on-ink-dim)' }}>{t.how}</p>
                <Link
                  href={locked ? '/membership' : t.href}
                  className="mt-auto self-start font-mono text-[0.6875rem] uppercase tracking-wide underline"
                  style={{ color: 'var(--brand-soft)' }}
                >
                  {locked ? 'Upgrade to Lens+' : t.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
