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
