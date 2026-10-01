import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import NavDrawer from "@/components/NavDrawer";
import { getStoryBySlug, getAllStories, ConfidenceLevel } from "@/lib/stories";
import { formatStoryDate } from "@/lib/formatDate";
import { PageViewBeacon } from "@/components/PageViewBeacon";
import { ShareButtons } from "@/components/ShareButtons";
import { OffLensSection } from "@/components/OffLensSection";
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

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return {};
  return {
    title: story.headline,
    description: story.dek ?? story.headline,
    openGraph: {
      title: story.headline,
      description: story.dek ?? story.headline,
      url: `https://chanakyalens.com/story/${slug}`,
      images: [{ url: `https://chanakyalens.com/api/og?slug=${slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: `summary_large_image`,
      title: story.headline,
      description: story.dek ?? story.headline,
      images: [`https://chanakyalens.com/api/og?slug=${slug}`],
    },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return notFound();

  const allStories = await getAllStories();

  const related = allStories
    .filter((s) => s.slug !== slug)
    .map((s) => ({
      story: s,
      score:
        (s.category === story.category ? 2 : 0) +
        (s.subjectCountries?.some((c) => story.subjectCountries?.includes(c)) ? 1 : 0),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.story.publishedAt).getTime() - new Date(a.story.publishedAt).getTime())
    .slice(0, 3)
    .map((s) => s.story);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": story.headline,
    "datePublished": story.publishedAt,
    "dateModified": story.publishedAt,
    "url": `https://chanakyalens.com/story/${slug}`,
    "image": `https://chanakyalens.com/api/og?slug=${slug}`,
    "description": story.dek ?? story.headline,
    "author": {
      "@type": "Organization",
      "name": "Chanakya Lens",
      "url": "https://chanakyalens.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Chanakya Lens",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chanakyalens.com/logo-mark.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://chanakyalens.com/story/${slug}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <PageViewBeacon path={`/story/${slug}`} />
      <NavDrawer />
      <div className="max-w-7xl mx-auto px-4 md:px-5 pt-4 md:pt-7 pb-16">
      <article className="max-w-2xl mx-auto md:max-w-none md:grid md:grid-cols-[1fr_380px] md:gap-10">
        <div className="flex flex-col">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide mb-5 hover:opacity-80"
          style={{ color: "var(--text-on-ink-dim)" }}
        >
          ← Back to feed
        </Link>

        {story.imageUrl && (
          <div className="mb-6">
            <div className="relative -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full h-56 md:h-72 md:rounded-sm overflow-hidden">
              <Image
                src={story.imageUrl}
                alt={story.headline}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {(() => {
              const primarySource = story.sources?.find((s) => s.role === "primary");
              return primarySource ? (
                <p className="mt-1.5 text-[0.68rem]" style={{ color: "var(--text-on-ink-dim)" }}>
                  Photo via{" "}
                  <a href={primarySource.url} target="_blank" rel="noreferrer" className="hover:opacity-80" style={{ textDecoration: "underline" }}>
                    {primarySource.domain}
                  </a>
                </p>
              ) : null;
            })()}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
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
                      : { color: "var(--settled)", borderColor: "var(--border)", background: "var(--surface-border)" }
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
                  {story.status === "developing" ? "Developing" : "Settled"}
                </span>
              </>
            )}
          </div>
          <ShareButtons slug={slug} headline={story.headline} />
        </div>
        <div className="font-mono text-[0.68rem] mb-2" style={{ color: "var(--text-on-ink-dim)" }}>
          {formatStoryDate(story.publishedAt)}
        </div>
        {story.subjectCountries && story.subjectCountries.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {story.subjectCountries.map((country) => (
              <span
                key={country}
                className="font-mono text-[0.6rem] uppercase tracking-wide px-2.5 py-1 rounded-full border"
                style={{ borderColor: "var(--border)", color: "var(--text-on-ink-dim)" }}
              >
                {country}
              </span>
            ))}
          </div>
        )}
        <h1 className="font-display font-bold text-[1.75rem] md:text-3xl leading-[1.15] mb-3 md:mb-4">{story.headline}</h1>
        <p className="text-base mb-6" style={{ color: "var(--text-body)" }}>{story.dek}</p>

        <p className="text-[0.95rem] leading-relaxed mb-8" style={{ color: "var(--text-body)" }}>{story.body}</p>

        {story.impactNodes && story.impactNodes.length > 0 && (
          <section className="mt-6 md:mt-9">
            <div className="font-display font-bold uppercase tracking-wide text-lg mb-1" style={{ color: "var(--brand-soft)" }}>
              How could this affect you
            </div>
            <div className="text-[0.78rem] mb-6" style={{ color: "var(--text-on-ink-dim)" }}>
              Traced by who&apos;s actually in the path of this — not everyone is.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {story.impactNodes.map((node, i) => (
                <div key={i} className="p-3.5 md:p-4 rounded-sm border" style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}>
                  <span
                    className="inline-block font-mono text-[0.6rem] uppercase tracking-wide rounded px-1.5 py-0.5 mb-2"
                    style={{ color: tagColor[node.confidence], background: `${tagColor[node.confidence]}20` }}
                  >
                    {tagLabel[node.confidence]}
                  </span>
                  <div className="text-[0.92rem] font-semibold mb-1">{node.audience}</div>
                  <div className="text-[0.84rem] md:text-[0.86rem] leading-snug md:leading-relaxed" style={{ color: "var(--text-body)" }}>{node.mechanism}</div>
                </div>
              ))}
            </div>
          </section>
        )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-6 md:sticky md:top-20 md:self-start">

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

        <OffLensSection
          headline={story.headline}
          sources={story.sources}
          subjectCountries={story.subjectCountries}
          offLens={story.offLens ?? undefined}
          offLensCountries={story.offLensCountries}
        />

        {story.chanakyaAnalysis && (
          <section
            className="mt-2 mb-6 md:mb-9 p-4 md:p-5 rounded-sm border-2"
            style={{ borderColor: "var(--brand-soft)", background: "var(--surface-strong)" }}
          >
            <div className="font-display font-bold uppercase tracking-wide text-xl mb-1.5" style={{ color: "var(--brand-soft)" }}>
              Chanakya&apos;s Move
            </div>
            <div className="text-[0.78rem] mb-4" style={{ color: "var(--text-on-ink-dim)" }}>
              Whose move this was, what they&apos;re betting on, what could counter it.
            </div>
            <p className="text-[0.95rem] leading-relaxed" style={{ color: "var(--text-on-ink)" }}>
              {story.chanakyaAnalysis}
            </p>
          </section>
        )}
        </aside>
      </article>

      {/* Full width below grid — Impact, Sources, Related */}
      <div className="mt-8 md:mt-10 space-y-8 md:space-y-10 max-w-screen-xl mx-auto md:px-8">
        

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

        {related.length > 0 && (
          <section className="mt-10 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="font-display font-bold uppercase tracking-wide text-lg mb-4" style={{ color: "var(--brand-soft)" }}>
              Related
            </div>
            <div className="space-y-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/story/${r.slug}`}
                  className="block p-3.5 rounded-sm border hover:opacity-80"
                  style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}
                >
                  <div className="font-mono text-[0.6rem] uppercase tracking-wide mb-1.5" style={{ color: "var(--brand-soft)" }}>
                    {r.category}
                  </div>
                  <div className="font-display font-bold text-[0.95rem] leading-tight">{r.headline}</div>
                </Link>
              ))}
            </div>
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
      </div>
      </div>
    </>
  );
}


