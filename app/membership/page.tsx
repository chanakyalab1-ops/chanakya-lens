import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavDrawer from "@/components/NavDrawer";
import { ManageButton, SubscribeButton } from "@/components/MembershipButtons";
import { isSandboxToken, paddleConfigured } from "@/lib/paddle";
import { getMembership, isActiveMember } from "@/lib/membership";
import { getSessionUser } from "@/lib/supabase-user";
import { pageMeta } from "@/lib/seo";
import { membershipVisibleTo } from "@/lib/memberAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...pageMeta(
  "/membership",
  "Membership | Chanakya Lens",
  "Support independent geopolitics reporting and get member features as they launch."
  ),
  // Kept out of search until membership is opened to the public.
  robots: process.env.MEMBERSHIP_PUBLIC === "true" ? undefined : { index: false, follow: false },
};

// Perks are listed honestly: what is live, and what is coming.
const PERKS: { text: string; live: boolean }[] = [
  { text: "Support independent, ad-free geopolitics reporting", live: true },
  { text: "A digest tuned to your countries and topics", live: false },
  { text: "Full Off-Lens detail and archive search", live: false },
  { text: "A weekly analyst briefing", live: false },
];

export default async function MembershipPage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const { canceled } = await searchParams;
  const open = paddleConfigured();
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID ?? "";
  const user = await getSessionUser();
  // Hidden from everyone but the owner until MEMBERSHIP_PUBLIC=true.
  if (!membershipVisibleTo(user?.email)) return notFound();
  const membership = user ? await getMembership(user.id) : null;
  const member = isActiveMember(membership);
  const price = process.env.MEMBERSHIP_PRICE_LABEL;

  return (
    <>
      <NavDrawer />
      <main className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <div className="font-mono text-[0.68rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>Membership</div>
        <h1 className="font-display font-bold text-3xl leading-tight mb-3">Become a Strategist</h1>
        <p className="text-[0.95rem] leading-relaxed mb-8" style={{ color: "var(--text-body)" }}>
          Every story on Chanakya Lens stays free to read. Strategists back the work and get member features as we launch them.
        </p>

        <div className="rounded-sm border p-5 mb-6" style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}>
          <div className="flex items-baseline justify-between mb-4">
            <div className="font-display font-bold text-xl">Strategist</div>
            {price && <div className="font-mono text-sm">{price}</div>}
          </div>
          <ul className="space-y-2 mb-5">
            {PERKS.map((p) => (
              <li key={p.text} className="text-[0.92rem] flex gap-2" style={{ color: "var(--text-body)" }}>
                <span aria-hidden>{p.live ? "✓" : "○"}</span>
                <span>
                  {p.text}
                  {!p.live && <span className="font-mono text-[0.62rem] uppercase ml-2" style={{ color: "var(--text-on-ink-dim)" }}>Coming soon</span>}
                </span>
              </li>
            ))}
          </ul>

          {!open ? (
            <p className="text-sm" style={{ color: "var(--text-on-ink-dim)" }}>
              Membership opens soon. <Link href="/digest" className="underline">Join the daily digest</Link> to hear first.
            </p>
          ) : member ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">You are a Strategist. Thank you.</p>
              <ManageButton />
            </div>
          ) : (
            <div className="space-y-3">
              {canceled && <p className="text-sm" style={{ color: "var(--text-on-ink-dim)" }}>Checkout canceled. You have not been charged.</p>}
              {user?.email ? (
                <SubscribeButton token={token} priceId={priceId} sandbox={isSandboxToken(token)} email={user.email} userId={user.id} />
              ) : (
                <Link href="/account/login" className="inline-block px-5 py-2.5 rounded-sm text-sm font-semibold text-white" style={{ background: "#0E7080" }}>
                  Sign in to join
                </Link>
              )}
              <p className="text-xs" style={{ color: "var(--text-on-ink-dim)" }}>
                Secure checkout by Paddle, our payment partner, which also handles sales tax. Cancel any time from your account.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs" style={{ color: "var(--text-on-ink-dim)" }}>
          Member features marked &ldquo;Coming soon&rdquo; are not available yet. See our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </main>
    </>
  );
}
