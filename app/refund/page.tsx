import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import NavDrawer from "@/components/NavDrawer";
import Link from "next/link";
import type { ReactNode } from "react";

const body = { color: "var(--text-body)" };
const heading = { color: "var(--brand-soft)" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-bold text-lg mb-3" style={heading}>{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function P({ children }: { children: ReactNode }) {
  return <p className="text-[0.9rem] leading-relaxed" style={body}>{children}</p>;
}
function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 list-disc pl-5">
      {items.map((item, i) => (
        <li key={i} className="text-[0.9rem] leading-relaxed" style={body}>{item}</li>
      ))}
    </ul>
  );
}
const Mail = () => <a href="mailto:chanakya.lab1@gmail.com" className="underline" style={heading}>chanakya.lab1@gmail.com</a>;

export const metadata: Metadata = pageMeta("/refund", "Refund and cancellation policy | Chanakya Lens", "How to cancel Chanakya Lens+, and when you can get a refund.");

export default function RefundPage() {
  return (
    <>
      <NavDrawer />
      <article className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-wide mb-5 hover:opacity-80" style={{ color: "var(--text-on-ink-dim)" }}>
          Back to feed
        </Link>
        <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={heading}>Legal</div>
        <h1 className="font-display font-bold text-3xl leading-tight mb-2">Refund and cancellation policy</h1>
        <p className="text-[0.8rem] mb-8" style={{ color: "var(--text-on-ink-dim)" }}>Last updated November 2026</p>

        <div className="space-y-8">
          <Section title="The short version">
            <List
              items={[
                "Cancel Lens+ any time. You keep your tools until the end of the period you have paid for.",
                "We do not give refunds for a period you have already used, except where the law or Paddle's buyer terms require one.",
                "Reading the news on Chanakya Lens is free and stays free.",
              ]}
            />
          </Section>

          <Section title="Cancelling">
            <P>
              Open <Link href="/account" className="underline" style={heading}>your account</Link> and choose Manage billing, then cancel. Your membership keeps working until the end of the period you have already paid for, and you will not be charged again. Cancelling does not delete your account, your Watchlist or your saved stories.
            </P>
          </Section>

          <Section title="Refunds">
            <List
              items={[
                <><b>The rule.</b> We do not refund a payment for a period you have already had access to, or a renewal, except where the law or Paddle&apos;s buyer terms say a refund is due. Where one is due, Paddle will process it and we will not stand in the way.</>,
                <><b>Before you pay.</b> Because of this, please check the plan and price at checkout. If you do not want to be charged again, cancel before your renewal date.</>,
                <><b>Gifts.</b> Gift codes follow the same rule. A code that has been redeemed cannot be refunded.</>,
                <><b>If you think a refund is due.</b> Email <Mail /> from the address you paid with, or use the link in your Paddle receipt, and tell us what happened. Refunds that are due go back to the original payment method, and how long they take to show up depends on your bank or card provider.</>,
              ]}
            />
          </Section>

          <Section title="Payments, receipts and tax">
            <P>
              Payments are handled by Paddle, our payment partner and the seller of record. Paddle takes your payment, collects any sales tax or VAT that applies, and sends your receipt. We never see your full card details. Paddle&apos;s own buyer terms also apply to your purchase.
            </P>
          </Section>

          <Section title="If a payment fails">
            <P>
              If a renewal payment does not go through, your Lens+ tools pause until the payment is fixed. You can update your card from Manage billing. Your free reading, account and saved stories are not affected.
            </P>
          </Section>

          <Section title="Price changes">
            <P>
              If we change the price of Lens+, we will tell you before it applies to your next renewal, so you can cancel first if you prefer.
            </P>
          </Section>

          <Section title="Your legal rights">
            <P>
              Nothing in this policy limits any rights you have under consumer protection law where you live, including any statutory right to cancel or to a refund.
            </P>
          </Section>

          <Section title="Contact">
            <P>Questions about billing or a refund: <Mail />.</P>
          </Section>
        </div>
      </article>
    </>
  );
}
