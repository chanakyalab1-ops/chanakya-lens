import type { Metadata } from 'next';
import Link from 'next/link';
import NavDrawer from '@/components/NavDrawer';
import { Icon } from '@/components/Icon';
import { pageMeta } from '@/lib/seo';
import { FEATURES, TIER_TITLE, type FeatureTier } from '@/lib/features';

export const metadata: Metadata = pageMeta(
  '/features',
  'Every feature | Chanakya Lens',
  'Everything Chanakya Lens does: impact tracing, Off-Lens, Today\'s Signal, the Lens pages, a Watchlist and My Lens feed, saved stories, Ask the Lens, Lens Monthly and more, and which are free.',
);

const TIERS: FeatureTier[] = ['everyone', 'account', 'plus'];

export default function FeaturesPage() {
  // Account tools and Lens+ open to the public at launch; until then the page says "Coming soon".
  const launched = process.env.MEMBERSHIP_PUBLIC === 'true';

  return (
    <>
      <NavDrawer />
      <main className="max-w-4xl mx-auto px-5 pt-10 pb-20">
        <section className="text-center mb-12">
          <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-soft)' }}>Features</div>
          <h1 className="font-display font-extrabold text-5xl leading-[1.03] mb-4">Everything Chanakya Lens does</h1>
          <p className="text-[1.05rem] leading-relaxed max-w-xl mx-auto mb-7" style={{ color: 'var(--text-body)' }}>
            Reading the news is free, always. Here is every tool we have built, what it does, where to find it, and what it costs.
          </p>
          {!launched && (
            <div className="inline-block rounded-sm border px-4 py-3 text-[0.9rem]" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
              Account tools and Lens+ open soon. <Link href="/membership" className="underline font-semibold" style={{ color: 'var(--brand-soft)' }}>Join the waitlist</Link> to get in first.
            </div>
          )}
        </section>

        {TIERS.map((tier) => {
          const list = FEATURES.filter((f) => f.tier === tier);
          return (
            <section key={tier} className="mb-12">
              <div className="flex items-end justify-between gap-3 mb-1">
                <h2 className="font-display font-bold uppercase tracking-wide text-2xl" style={{ color: tier === 'plus' ? '#C97B4A' : 'var(--brand-soft)' }}>{TIER_TITLE[tier].title}</h2>
                <span className="font-mono text-[0.6875rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>{list.length} features</span>
              </div>
              <p className="text-[0.9rem] mb-4" style={{ color: 'var(--text-body)' }}>{TIER_TITLE[tier].blurb}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {list.map((f) => {
                  const soon = f.gated && !launched;
                  return (
                    <div key={f.name} className="rounded-sm border p-4 flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span style={{ color: '#0E7080' }}><Icon name={f.icon} size={24} /></span>
                        {soon && (
                          <span className="font-mono text-[0.6875rem] uppercase tracking-wide rounded-full px-2 py-0.5 border" style={{ borderColor: '#C97B4A', color: '#C97B4A' }}>Coming soon</span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-[1.1rem] mb-1">{f.name}</h3>
                      <p className="text-[0.86rem] leading-snug mb-2" style={{ color: 'var(--text-body)' }}>{f.text}</p>
                      <p className="text-[0.78rem]" style={{ color: 'var(--text-on-ink-dim)' }}>{f.how}</p>
                      {f.href && !soon && (
                        <Link href={f.href} className="mt-3 self-start font-mono text-[0.6875rem] uppercase tracking-wide underline" style={{ color: 'var(--brand-soft)' }}>Open</Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section className="text-center rounded-sm border p-8" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
          <h2 className="font-display font-extrabold text-3xl mb-2">Lens<span style={{ color: 'var(--brand-soft)' }}>+</span></h2>
          <p className="text-[0.95rem] max-w-md mx-auto mb-5" style={{ color: 'var(--text-body)' }}>
            Lens+ is the member plan that adds the tools above. Every story stays free, with or without it.
          </p>
          <Link href="/membership" className="inline-block px-6 py-3 text-sm font-semibold rounded-sm" style={{ background: '#0E7080', color: '#fff' }}>
            {launched ? 'See Lens+' : 'Join the waitlist'}
          </Link>
        </section>
      </main>
    </>
  );
}
