import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { PAID_FEATURES, type PaidFeature } from '@/lib/entitlements';

// Shown in place of a Lens+ tool to a signed-in reader who is not a member.
export function UpgradeNotice({ feature, icon, heading }: { feature: PaidFeature; icon: string; heading?: string }) {
  const f = PAID_FEATURES[feature];
  return (
    <div className="rounded-sm border p-6 text-center" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
      <div className="flex justify-center mb-3" style={{ color: '#0E7080' }}><Icon name={icon} size={30} /></div>
      <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-soft)' }}>Lens+ feature</div>
      <h2 className="font-display font-extrabold text-2xl mb-2">{heading ?? `${f.name} is for Lens+ members`}</h2>
      <p className="text-[0.92rem] max-w-md mx-auto mb-5" style={{ color: 'var(--text-body)' }}>{f.blurb} Every story stays free.</p>
      <Link href="/membership" className="inline-block px-6 py-3 text-sm font-semibold rounded-sm" style={{ background: '#0E7080', color: '#fff' }}>
        Upgrade to Lens+
      </Link>
    </div>
  );
}
