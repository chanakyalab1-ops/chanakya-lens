import Link from "next/link";
import NavDrawer from "@/components/NavDrawer";

const tags = [
  { label: "Direct", color: "var(--direct)", desc: "This is simply how it works. The mechanism isn't in dispute — e.g., import tariffs are paid by the importer, not the exporting country." },
  { label: "Likely", color: "var(--likely)", desc: "Follows from precedent or stated policy, but depends on something not yet confirmed — a bill passing, a pricing decision, a competitor's move." },
  { label: "Possible", color: "var(--possible)", desc: "A reasonable read further down the chain. More speculative, but worth knowing. We include it because it's relevant — not because we're confident it will happen." },
];

const principles = [
  { title: "Why \"could,\" never \"will\"", body: "We're not forecasters. Every impact section is written as a scenario — a plausible chain of cause and effect — not a prediction. If we're not confident something will happen, we don't say it will." },
  { title: "Not every story earns this treatment", body: "We only add impact tags when a story has a genuine, traceable chain to a reader's life. If we can't make a real case for relevance, we don't force one — the story runs as a plain brief instead." },
  { title: "One story, any source", body: "A story might come from wire reporting, or from one of our own video briefs. Either way, it goes through the same rating system." },
];

export default function HowWeRatePage() {
  return (
    <>
      <NavDrawer />
      <div className="max-w-xl mx-auto px-5 pt-8 pb-16">
        <div className="font-mono text-[0.66rem] uppercase tracking-widest mb-2.5" style={{ color: "var(--brand-soft)" }}>Methodology</div>
        <h1 className="font-display font-bold text-4xl leading-tight mb-4">How we rate this</h1>
        <p className="text-base max-w-md mb-2" style={{ color: "var(--text-body)" }}>
          Every &quot;How Could This Affect You&quot; story breaks a news event into specific ways it could reach you. Here&apos;s exactly what the tags mean.
        </p>

        <div className="h-px my-8.5" style={{ background: "var(--border)" }} />

        <h2 className="font-display font-bold text-xl mb-2.5">We rate the mechanism, not the news</h2>
        <p className="text-[0.92rem] max-w-md mb-6.5" style={{ color: "var(--text-body)" }}>
          The color next to each impact line tells you how solid the reasoning is — not how certain the underlying event is.
        </p>

        <h2 className="font-display font-bold text-xl mb-2.5">The impact tags</h2>
        <div className="mb-7.5">
          {tags.map((t) => (
            <div key={t.label} className="flex gap-3.5 py-4 border-t last:border-b" style={{ borderColor: "var(--border)" }}>
              <div className="h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ boxShadow: `0 0 0 1px ${t.color}` }}>
                <div className="h-full w-full rounded-full scale-50" style={{ background: t.color }} />
              </div>
              <div>
                <span className="block font-mono text-[0.62rem] uppercase tracking-wide mb-1" style={{ color: t.color }}>{t.label}</span>
                <div className="text-[0.88rem]" style={{ color: "var(--text-body)" }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {principles.map((p) => (
          <div key={p.title} className="p-4.5 border-l-2 mb-4 rounded-r-sm" style={{ borderColor: "var(--brand)", background: "rgba(95,168,181,0.06)" }}>
            <div className="font-display font-bold text-lg mb-1.5" style={{ color: "var(--brand-soft)" }}>{p.title}</div>
            <div className="text-[0.88rem]" style={{ color: "var(--text-body)" }}>{p.body}</div>
          </div>
        ))}

        <Link href="/" className="inline-block mt-4 text-[0.85rem] underline" style={{ color: "var(--brand-soft)" }}>← Back to feed</Link>
      </div>
    </>
  );
}
