import type { Metadata } from 'next';
import NavDrawer from '@/components/NavDrawer';
import { Icon } from '@/components/Icon';
import { BusinessForm } from '@/components/BusinessForm';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta(
  '/business',
  'Chanakya Lens+ for Business | Shipping and trade-risk briefings',
  'Weekly shipping and trade-risk briefings for exporters, importers and logistics teams: what is disrupting routes, which countries are affected, and what to watch next.',
);

const GET = [
  { icon: 'compass', title: 'A weekly risk brief', text: 'One short brief on what is disrupting shipping and trade this week, by route and country, with what to watch next.' },
  { icon: 'eye', title: 'Alerts on your routes', text: 'A message when something changes on the routes and countries you tell us you use.' },
  { icon: 'target', title: 'Ratings you can act on', text: 'Every effect is marked Direct, Likely or Possible, so you can see how solid the reasoning is before you act.' },
  { icon: 'compare', title: 'Plain words, India first', text: 'What a closure, sanction or tariff means for costs, transit times and suppliers, not just the headline.' },
];

const WHO = ['Exporters and importers', 'Freight forwarders and logistics teams', 'Manufacturers with overseas suppliers', 'Traders and commodity desks', 'Consultants and analysts who advise them'];

const FAQ = [
  { q: 'What do I get by joining?', a: 'A free sample brief first, then early access to the pilot when it opens. We will ask what would make it useful for your business before we decide what to charge.' },
  { q: 'What will it cost?', a: 'Not decided yet. Pilot members will help set the price, and will not be charged anything without agreeing to it first.' },
  { q: 'Is this financial or legal advice?', a: 'No. Briefs are analysis and context to help your own judgment. They are not advice on any specific shipment, contract or trade.' },
  { q: 'How is this different from a free freight newsletter?', a: 'We explain what an event means for your costs and suppliers, rate how certain each effect is, and show who is and is not covering the story.' },
  { q: 'Is the reader product the same thing?', a: 'No. Lens+ for readers is a separate, low-priced plan for individuals. This is for companies. Join the reader waitlist at chanakyalens.com/membership.' },
];

export default function BusinessPage() {
  return (
    <>
      <NavDrawer />
      <main className="max-w-3xl mx-auto px-5 pt-10 pb-20">
        <section className="text-center mb-12">
          <div className="inline-block font-mono text-[0.6875rem] uppercase tracking-widest rounded-full px-3 py-1.5 mb-5 text-white" style={{ background: '#C97B4A' }}>Pilot list open</div>
          <h1 className="font-display font-extrabold text-5xl md:text-6xl leading-[1.02] mb-4">
            Chanakya Lens<span style={{ color: 'var(--brand-soft)' }}>+</span> for Business
          </h1>
          <p className="text-[1.05rem] leading-relaxed max-w-xl mx-auto mb-7" style={{ color: 'var(--text-body)' }}>
            Shipping and trade-risk briefings, written in plain words: what is disrupting your routes, which countries are affected, and what to watch next.
          </p>
          <a href="#join" className="inline-block px-7 py-3.5 text-sm font-semibold rounded-sm" style={{ background: '#0E7080', color: '#fff' }}>Join the pilot list</a>
        </section>

        <section className="mb-12">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: 'var(--brand-soft)' }}>What we are building</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {GET.map((g) => (
              <div key={g.title} className="rounded-sm border p-4" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                <div className="mb-2" style={{ color: '#0E7080' }}><Icon name={g.icon} size={24} /></div>
                <div className="font-display font-bold text-[1.05rem] mb-1">{g.title}</div>
                <p className="text-[0.84rem] leading-snug" style={{ color: 'var(--text-body)' }}>{g.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 max-w-xl mx-auto">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: 'var(--brand-soft)' }}>Who it is for</h2>
          <ul className="space-y-2">
            {WHO.map((w) => (
              <li key={w} className="rounded-sm border px-4 py-3 text-[0.95rem]" style={{ borderColor: 'var(--border)' }}>{w}</li>
            ))}
          </ul>
        </section>

        <section id="join" className="max-w-xl mx-auto mb-14 scroll-mt-24">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-2 text-center" style={{ color: 'var(--brand-soft)' }}>Join the pilot list</h2>
          <p className="text-[0.88rem] text-center mb-5" style={{ color: 'var(--text-body)' }}>We will send a free sample brief first. No payment details, no commitment.</p>
          <BusinessForm />
        </section>

        <section>
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: 'var(--brand-soft)' }}>Questions</h2>
          <div className="space-y-2">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-sm border p-4" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                <summary className="font-semibold cursor-pointer">{f.q}</summary>
                <p className="text-[0.9rem] leading-relaxed mt-2" style={{ color: 'var(--text-body)' }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
