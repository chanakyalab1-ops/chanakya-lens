import type { Metadata } from 'next';
import NavDrawer from '@/components/NavDrawer';
import { Icon } from '@/components/Icon';
import { CreatorForm } from '@/components/CreatorForm';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta(
  '/creators',
  'Creator partners | Chanakya Lens',
  'Partner with Chanakya Lens: free Lens+, a tracked link and a share of what your audience pays. For creators who cover world affairs, the economy and policy.',
);

const GET = [
  { icon: 'shield', title: 'Free Lens+ for as long as we partner', text: 'Every member tool, free, so you can use it and talk about it honestly.' },
  { icon: 'link', title: 'Your own tracked link', text: 'chanakyalens.com/?ref=yourname. We count who signs up through it and send you a clear report.' },
  { icon: 'chat', title: '20% of first-year revenue', text: 'You receive 20% of what we collect from members you bring in, for their first 12 months. After payment fees and taxes.' },
  { icon: 'eye', title: 'A feature on the site', text: 'A partner page and a mention in our digest, so your audience has a reason to click back to you.' },
];

const STEPS = [
  { n: '1', title: 'Apply below', text: 'Tell us about your channel. We reply by email.' },
  { n: '2', title: 'Get your link and a Lens+ account', text: 'We set up your link and give you free access to try everything.' },
  { n: '3', title: 'Share what you honestly like', text: 'Mention us in your own words. We never script you.' },
  { n: '4', title: 'Get paid monthly', text: 'Payouts begin once Lens+ is live. We tell you the payout minimum and method upfront.' },
];

const FAQ = [
  { q: 'Who is this for?', a: 'Creators and writers who cover world affairs, geopolitics, the economy, policy or current affairs, in any language, and whose audience would value knowing what a story means for them.' },
  { q: 'Do you need a big following?', a: 'No. A small, engaged audience that trusts you is worth more to us than a large one that does not.' },
  { q: 'What do I have to say?', a: 'Whatever you honestly think. You must tell your audience about the partnership, as advertising rules in India, the US and the EU require, for example by saying "partner" or "affiliate link". We will not ask you to claim anything untrue.' },
  { q: 'When do payouts start?', a: 'Lens+ is not on sale yet. Sign-ups through your link are counted from today, and revenue share starts when paid memberships open.' },
  { q: 'Can either side stop?', a: 'Yes, at any time. We may end a partnership if misleading claims are made about us. Payouts already earned are still paid.' },
];

export default function CreatorsPage() {
  return (
    <>
      <NavDrawer />
      <main className="max-w-3xl mx-auto px-5 pt-10 pb-20">
        <section className="text-center mb-12">
          <div className="inline-block font-mono text-[0.6875rem] uppercase tracking-widest rounded-full px-3 py-1.5 mb-5 text-white" style={{ background: '#C97B4A' }}>Creator partners</div>
          <h1 className="font-display font-extrabold text-5xl md:text-6xl leading-[1.02] mb-4">
            Bring the <span style={{ color: 'var(--brand-soft)' }}>local math</span> to your audience.
          </h1>
          <p className="text-[1.05rem] leading-relaxed max-w-xl mx-auto mb-7" style={{ color: 'var(--text-body)' }}>
            Chanakya Lens traces world events to what they mean for readers: their bills, their jobs, their country. If your audience follows the news, we would like to work with you.
          </p>
          <a href="#apply" className="inline-block px-7 py-3.5 text-sm font-semibold rounded-sm" style={{ background: "#0E7080", color: "#fff" }}>Apply to partner</a>
        </section>

        <section className="mb-12">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: 'var(--brand-soft)' }}>What you get</h2>
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

        <section className="mb-12">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: 'var(--brand-soft)' }}>How it works</h2>
          <ol className="grid sm:grid-cols-2 gap-3">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-sm border p-4" style={{ borderColor: 'var(--border)' }}>
                <span className="font-display font-extrabold text-3xl leading-none" style={{ color: '#0E7080' }}>{s.n}</span>
                <span>
                  <span className="block font-semibold mb-0.5">{s.title}</span>
                  <span className="text-[0.84rem]" style={{ color: 'var(--text-body)' }}>{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section id="apply" className="max-w-xl mx-auto mb-14 scroll-mt-24">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: 'var(--brand-soft)' }}>Apply</h2>
          <CreatorForm />
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
