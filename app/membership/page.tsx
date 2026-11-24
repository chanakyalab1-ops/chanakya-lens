import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavDrawer from "@/components/NavDrawer";
import { ManageButton } from "@/components/MembershipButtons";
import PlanPicker from "@/components/PlanPicker";
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
const PERKS: { icon: string; title: string; text: string; live: boolean }[] = [
  { icon: "🛡", title: "Back independent reporting", text: "No ads, no sponsored stories. Your membership pays for the research behind every story.", live: true },
  { icon: "🎯", title: "An unlimited Watchlist", text: "Watch the countries, chokepoints, actors and topics you care about, and get a My Lens feed built around them.", live: true },
  { icon: "🔗", title: "Connected stories", text: "Every story shows what else is happening on the same places, actors and themes, so you can follow one thread across the news.", live: true },
  { icon: "👁", title: "Watch single stories", text: "Get an alert when one specific story is updated, plus a plain note on what changed.", live: true },
  { icon: "📴", title: "Offline reading", text: "Saved stories open on your device even without a connection.", live: true },
  { icon: "📬", title: "The full weekly analyst briefing", text: "A longer email each week on the stories that will matter most, with the connections between them. Everyone gets a short preview; Lens+ members get the whole briefing.", live: false },
  { icon: "🔎", title: "Full Off-Lens archive and search", text: "Search every story's coverage map by country, outlet and date.", live: false },
];

const COMPARE: { row: string; free: string; paid: string }[] = [
  { row: "Every story and its full analysis", free: "✓", paid: "✓" },
  { row: "Off-Lens coverage maps", free: "✓", paid: "✓" },
  { row: "Daily digest and notifications", free: "✓", paid: "✓" },
  { row: "Watchlist and My Lens feed", free: "Up to 3 items", paid: "Unlimited" },
  { row: "Weekly analyst briefing", free: "Preview (soon)", paid: "Full briefing (soon)" },
  { row: "Archive search", free: "–", paid: "✓ (soon)" },
];

const FAQ: { q: string; a: string }[] = [
  { q: "What do I get today?", a: "Today your membership supports the site, and you get each feature marked Coming soon as it launches. We add them one at a time and say so on the What's new page." },
  { q: "Can I cancel?", a: "Yes, any time. Open your account and choose Manage billing. You keep your membership until the end of the period you have paid for." },
  { q: "Who handles the payment?", a: "Paddle, our payment partner. It processes your card, collects any sales tax, and sends your receipt. We never see your card details." },
  { q: "Will every story stay free?", a: "Yes. Lens+ members back the work and get extra tools. Reading the news is never locked." },
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
  const yearlyPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_YEARLY;
  const yearlyLabel = process.env.MEMBERSHIP_PRICE_LABEL_YEARLY;
  const renews = membership?.currentPeriodEnd
    ? new Date(membership.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <>
      <NavDrawer />
      <main className="max-w-3xl mx-auto px-5 pt-8 pb-20">
        <section className="text-center mb-10">
          <div className="font-mono text-[0.68rem] uppercase tracking-widest mb-3" style={{ color: "var(--brand-soft)" }}>Membership</div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-[1.05] mb-4">Read the world a step ahead.</h1>
          <p className="text-[1.02rem] leading-relaxed max-w-xl mx-auto" style={{ color: "var(--text-body)" }}>
            Every story stays free. Lens+ members back independent, ad-free geopolitics reporting, and get member tools as we build them.
          </p>
        </section>

        <section className="max-w-xl mx-auto mb-12">
          {!open ? (
            <div className="text-center p-5 border rounded-sm" style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}>
              <div className="font-display font-bold text-xl mb-1">Membership opens soon</div>
              <p className="text-sm" style={{ color: "var(--text-body)" }}>
                <Link href="/digest" className="underline">Join the daily digest</Link> to hear first.
              </p>
            </div>
          ) : member ? (
            <div className="p-6 border rounded-sm text-center" style={{ borderColor: "#0E7080", background: "var(--ink-card)", boxShadow: "0 0 0 2px #0E7080" }}>
              <div className="font-display font-extrabold text-2xl mb-1">You are a Lens+ member. Thank you.</div>
              {renews && (
                <p className="text-sm mb-4" style={{ color: "var(--text-on-ink-dim)" }}>
                  {membership?.cancelAtPeriodEnd ? "Ends" : "Renews"} {renews}
                </p>
              )}
              <div className="flex justify-center"><ManageButton /></div>
            </div>
          ) : (
            <div>
              {canceled && <p className="text-sm text-center mb-3" style={{ color: "var(--text-on-ink-dim)" }}>Checkout canceled. You have not been charged.</p>}
              <PlanPicker
                token={token}
                sandbox={isSandboxToken(token)}
                user={user?.email ? { email: user.email, id: user.id } : null}
                monthly={{ priceId, label: price ?? "Monthly" }}
                yearly={yearlyPriceId ? { priceId: yearlyPriceId, label: yearlyLabel ?? "Yearly" } : null}
              />
              <p className="text-center text-[0.78rem] mt-3" style={{ color: "var(--text-on-ink-dim)" }}>
                Secure checkout by Paddle · Cancel any time · Taxes handled for you
              </p>
            </div>
          )}
        </section>

        <section className="mb-12">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: "var(--brand-soft)" }}>What you get</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PERKS.map((p) => (
              <div key={p.title} className="p-4 border rounded-sm" style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}>
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="text-2xl" aria-hidden>{p.icon}</div>
                  <span
                    className="font-mono text-[0.58rem] uppercase tracking-wide px-2 py-0.5 rounded-full border"
                    style={p.live ? { color: "#0E7080", borderColor: "#0E7080" } : { color: "var(--text-on-ink-dim)", borderColor: "var(--border)" }}
                  >
                    {p.live ? "Live" : "Coming soon"}
                  </span>
                </div>
                <div className="font-display font-bold text-lg leading-tight mb-1">{p.title}</div>
                <p className="text-[0.85rem] leading-snug" style={{ color: "var(--text-body)" }}>{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: "var(--brand-soft)" }}>Free and Lens+</h2>
          <div className="border rounded-sm overflow-hidden text-[0.88rem]" style={{ borderColor: "var(--border)" }}>
            <div className="grid grid-cols-[1.6fr_1fr_1fr] font-mono text-[0.62rem] uppercase tracking-wide p-3" style={{ background: "var(--ink-card)", color: "var(--text-on-ink-dim)" }}>
              <div />
              <div className="text-center">Free</div>
              <div className="text-center" style={{ color: "#0E7080" }}>Lens+</div>
            </div>
            {COMPARE.map((c) => (
              <div key={c.row} className="grid grid-cols-[1.6fr_1fr_1fr] p-3 border-t items-center" style={{ borderColor: "var(--border)" }}>
                <div>{c.row}</div>
                <div className="text-center" style={{ color: "var(--text-on-ink-dim)" }}>{c.free}</div>
                <div className="text-center font-semibold">{c.paid}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-bold uppercase tracking-wide text-xl mb-4 text-center" style={{ color: "var(--brand-soft)" }}>Questions</h2>
          <div className="space-y-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group border rounded-sm p-4" style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}>
                <summary className="font-display font-bold text-lg leading-tight list-none flex items-center justify-between gap-3">
                  {f.q}
                  <span aria-hidden className="transition-transform group-open:rotate-45 text-xl" style={{ color: "var(--brand-soft)" }}>+</span>
                </summary>
                <p className="text-[0.9rem] leading-relaxed mt-2" style={{ color: "var(--text-body)" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="text-xs text-center" style={{ color: "var(--text-on-ink-dim)" }}>
          Features marked &ldquo;Coming soon&rdquo; are not available yet. See our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </main>
    </>
  );
}
