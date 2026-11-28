import NavDrawer from '@/components/NavDrawer';
import { Icon } from '@/components/Icon';
import { WaitlistForm } from '@/components/WaitlistForm';

type Perk = { icon: string; title: string; text: string };
type Row = { row: string; free: string; paid: string };

// What /membership shows to everyone until MEMBERSHIP_PUBLIC=true.
export function WaitlistPage({ perks, compare }: { perks: Perk[]; compare: Row[] }) {
  return (
    <>
      <NavDrawer />
      <main className="max-w-3xl mx-auto px-5 pt-10 pb-20">
        <section className="text-center mb-10">
          <div className="inline-block font-mono text-[0.6875rem] uppercase tracking-widest rounded-full px-3 py-1.5 mb-5 text-white" style={{ background: '#C97B4A' }}>Coming soon</div>
          <h1 className="font-display font-extrabold text-5xl md:text-6xl leading-[1.02] mb-4">
            Lens<span style={{ color: 'var(--brand-soft)' }}>+</span> is almost here.
          </h1>
          <p className="text-[1.05rem] leading-relaxed max-w-xl mx-auto mb-8" style={{ color: 'var(--text-body)' }}>
            Every story stays free. Lens+ adds the tools: an unlimited Watchlist, answers from our own reporting, a Reading Map and alerts on single stories. Join the waitlist and you get in first.
          </p>
          <div className="max-w-lg mx-auto">
            <WaitlistForm source="membership" />
            <p className="text-[0.75rem] mt-3" style={{ color: 'var(--text-on-ink-dim)' }}>One email when it opens. No spam, and you can ignore it.</p>
          </div>
        </section>

        <section className="mb-12" aria-labelledby="pricing-heading">
          <h2 id="pricing-heading" className="font-display font-bold uppercase tracking-wide text-xl mb-1 text-center" style={{ color: 'var(--brand-soft)' }}>Pricing</h2>
          <p className="text-[0.85rem] text-center mb-4" style={{ color: 'var(--text-on-ink-dim)' }}>Planned prices for Lens+. Every story stays free to read.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-sm border p-5" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
              <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-2" style={{ color: 'var(--text-on-ink-dim)' }}>Monthly</div>
              <div className="font-display font-extrabold text-4xl">$2.99<span className="text-base font-semibold" style={{ color: 'var(--text-on-ink-dim)' }}> / month</span></div>
              <p className="text-[0.84rem] mt-2" style={{ color: 'var(--text-body)' }}>Billed every month until you cancel. Cancel any time from your account.</p>
            </div>
            <div className="rounded-sm border p-5" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
              <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-soft)' }}>Yearly</div>
              <div className="font-display font-extrabold text-4xl">$29.99<span className="text-base font-semibold" style={{ color: 'var(--text-on-ink-dim)' }}> / year</span></div>
              <p className="text-[0.84rem] mt-2" style={{ color: 'var(--text-body)' }}>About $2.50 a month. Billed once a year until you cancel. Cancel any time from your account.</p>
            </div>
          </div>
          <p className="text-[0.8rem] mt-3 text-center" style={{ color: 'var(--text-on-ink-dim)' }}>
            Gift a year of Lens+: a one-time payment, with no renewal. Payments are handled by Paddle, our payment partner and merchant of record. See our <a href="/terms" className="underline">terms</a>, <a href="/privacy" className="underline">privacy policy</a> and <a href="/refund" className="underline">refund policy</a>.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: 'var(--brand-soft)' }}>What you will get</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {perks.map((p) => (
              <div key={p.title} className="rounded-sm border p-4" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
                <div className="mb-2" style={{ color: '#0E7080' }}><Icon name={p.icon} size={24} /></div>
                <div className="font-display font-bold text-[1.05rem] mb-1">{p.title}</div>
                <p className="text-[0.84rem] leading-snug" style={{ color: 'var(--text-body)' }}>{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: 'var(--brand-soft)' }}>Free and Lens+</h2>
          <div className="border rounded-sm overflow-hidden text-[0.88rem]" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-[1.6fr_1fr_1fr] font-mono text-[0.6875rem] uppercase tracking-wide p-3" style={{ background: 'var(--ink-card)', color: 'var(--text-on-ink-dim)' }}>
              <div />
              <div className="text-center">Free</div>
              <div className="text-center" style={{ color: '#0E7080' }}>Lens+</div>
            </div>
            {compare.map((c) => (
              <div key={c.row} className="grid grid-cols-[1.6fr_1fr_1fr] p-3 border-t items-center" style={{ borderColor: 'var(--border)' }}>
                <div>{c.row}</div>
                <div className="text-center" style={{ color: 'var(--text-on-ink-dim)' }}>{c.free}</div>
                <div className="text-center font-semibold">{c.paid}</div>
              </div>
            ))}
          </div>
          <div className="max-w-lg mx-auto mt-8">
            <WaitlistForm source="membership-table" />
          </div>
        </section>
      </main>
    </>
  );
}
