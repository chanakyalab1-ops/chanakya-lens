import type { Metadata } from 'next';
import NavDrawer from '@/components/NavDrawer';
import CheckoutLanding from '@/components/CheckoutLanding';
import { isSandboxToken } from '@/lib/paddle';

export const metadata: Metadata = { title: 'Secure checkout | Chanakya Lens', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Paddle's "default payment link". It has no buttons of its own: it only opens a checkout when Paddle sends
// someone here with a valid payment link (`?_ptxn=...`).
export default function CheckoutPage() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '';
  return (
    <>
      <NavDrawer />
      <CheckoutLanding token={token} sandbox={isSandboxToken(token)} />
    </>
  );
}
