import { notFound } from "next/navigation";
import Link from "next/link";
import NavDrawer from "@/components/NavDrawer";
import { getStoryBySlug, ConfidenceLevel } from "@/lib/stories";

const tagColor: Record<ConfidenceLevel, string> = {
  direct: "var(--direct)",
  likely: "var(--likely)",
  possible: "var(--possible)",
};
const tagLabel: Record<ConfidenceLevel, string> = {
  direct: "Direct",
  likely: "Likely",
  possible: "Possible",
};

export const revalidate = 60;

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return notFound();

  return (
    <>
      <NavDrawer />
      <article className="max-w-xl mx-auto px-5 pt-7 pb-16">
        <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
          <span className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: "var(--brand-soft)" }}>
            {story.category}
          </span>
          {story.status && (
            <>
              <span className="text-[0.7rem]" style={{ color: "var(--text-on-ink-dim)" }}>·</span>
              <span
                className="font-mono text-[0.62rem] uppercase tracking-wide rounded-full border px-2 py-0.5 flex items-center gap-1.5"
                style={
                  story.status === "developing"
                    ? { color: "var(--developing)", borderColor: "rgba(217,105,74,0.5)", background: "rgba(217,105,74,0.08)" }
                    : { color: "var(--settled)", borderColor: "#2A3D74", background: "rgba(255,255,255,0.02)" }
                }
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
                {story.status === "developing" ? "Developing" : "Settled"}
              </span>
            </>
          )}
        </div>

        <h1 className="font-display font-bold text-3xl leading-tight mb-4">{story.headline}</h1>
        <p className="text-base mb-6" style={{ color: "var(--text-body)" }}>{story.dek}</p>

        <p className="text-[0.95rem] leading-relaxed mb-8" style={{ color: "#C6D0E8" }}>{story.body}</p>

        {story.hasVideo && (
          <div
            className="flex gap-3 items-center p-3.5 rounded-sm border mb-8"
            style={{ borderColor: "var(--border)", background: "linear-gradient(135deg, rgba(95,168,181,0.08), transparent)" }}
          >
            <div className="h-8.5 w-8.5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--brand)" }}>
              <svg viewBox="0 0 12 14" fill="none" className="h-2.5 w-2.5">
                <path d="M11 6.13a1 1 0 0 1 0 1.74L1.75 13.5A1 1 0 0 1 .25 12.63V1.37A1 1 0 0 1 1.75.5L11 6.13Z" fill="var(--paper)" />
              </svg>
            </div>
            <div className="text-sm" style={{ color: "var(--text-body)" }}>
              <strong style={{ color: "var(--text-on-ink)" }}>Video brief attached —</strong> companion piece with more detail.
            </div>
          </div>
        )}

        {story.impactNodes && story.impactNodes.length > 0 && (
          <section className="mt-9">
            <div className="font-display font-bold uppercase tracking-wide text-lg mb-1" style={{ color: "var(--brand-soft)" }}>
              How could this affect you
            </div>
            <div className="text-[0.78rem] mb-6" style={{ color: "var(--text-on-ink-dim)" }}>
              Traced by who&apos;s actually in the path of this — not everyone is.
            </div>

            <div className="relative pl-6.5">
              <div
                className="absolute left-[5px] top-1.5 bottom-1.5 w-px"
                style={{ backgroundImage: "linear-gradient(to bottom, #3A5192 0 4px, transparent 4px 8px)", backgroundSize: "1px 8px" }}
              />
              {story.impactNodes.map((node, i) => (
                <div key={i} className="relative mb-5.5 last:mb-0">
                  <span
                    className="absolute -left-6.5 top-1.5 h-2.5 w-2.5 rounded-full"
                    style={{ boxShadow: `0 0 0 1px ${tagColor[node.confidence]}`, border: "2px solid var(--ink)" }}
                  >
                    <span className="absolute inset-0.5 rounded-full" style={{ background: tagColor[node.confidence] }} />
                  </span>
                  <span
                    className="inline-block font-mono text-[0.6rem] uppercase tracking-wide rounded px-1.5 py-0.5 mb-1.5"
                    style={{ color: tagColor[node.confidence], background: `${tagColor[node.confidence]}20` }}
                  >
                    {tagLabel[node.confidence]}
                  </span>
                  <div className="text-[0.92rem] font-semibold mb-1">{node.audience}</div>
                  <div className="text-[0.86rem] leading-relaxed" style={{ color: "#B9B4A6" }}>{node.mechanism}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {story.sources && story.sources.length > 0 && (
          <section className="mt-9">
            <div className="font-display font-bold uppercase tracking-wide text-lg mb-1" style={{ color: "var(--brand-soft)" }}>
              Sources
            </div>
            <div className="text-[0.78rem] mb-5" style={{ color: "var(--text-on-ink-dim)" }}>
              Every claim here traces back to reporting you can read yourself.
            </div>
            <div className="space-y-2">
              {story.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 p-3 rounded-sm border hover:opacity-80"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="text-[0.85rem] truncate" style={{ color: "var(--text-body)" }}>
                    {source.title}
                  </span>
                  <span className="font-mono text-[0.62rem] uppercase tracking-wide shrink-0" style={{ color: "var(--text-on-ink-dim)" }}>
                    {source.sourceCountry ?? source.domain}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
         {story.chanakyaAnalysis && (
          <section className="mt-9">
            <div className="font-display font-bold uppercase tracking-wide text-lg mb-1" style={{ color: "var(--brand-soft)" }}>
              Chanakya&apos;s Move
            </div>
            <div className="text-[0.78rem] mb-5" style={{ color: "var(--text-on-ink-dim)" }}>
              Whose move this was, what they&apos;re betting on, what could counter it.
            </div>
            <p className="text-[0.9rem] leading-relaxed" style={{ color: "#C6D0E8" }}>
              {story.chanakyaAnalysis}
            </p>
          </section>
        )}
        <div className="flex items-center gap-2 mt-8.5 pt-5 border-t font-mono text-[0.68rem]" style={{ borderColor: "var(--border)", color: "var(--text-on-ink-dim)" }}>
          <div className="flex gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--direct)" }} />
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--likely)" }} />
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--possible)" }} />
          </div>
          <span>
            Tags rate the mechanism, not the news.{" "}
            <Link href="/how-we-rate" className="underline" style={{ color: "var(--brand-soft)" }}>How we rate this →</Link>
          </span>
        </div>
      </article>
    </>
  );
}