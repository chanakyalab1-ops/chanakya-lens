import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import NavDrawer from "@/components/NavDrawer";
import { getStoryBySlug, getAllStories, ConfidenceLevel } from "@/lib/stories";
import { formatStoryDate } from "@/lib/formatDate";
import { logPageView } from "@/lib/analytics";
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

export const revalidate = 300;

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
      images: [{ url: `https://chanakyalens.com/api/story-card/${slug}`, width: 1080, height: 1920 }],
    },
    twitter: {
      card: `summary_large_image`,
      title: story.headline,
      description: story.dek ?? story.headline,
      images: [`https://chanakyalens.com/api/story-card/${slug}`],
    },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return notFound();
  logPageView(`/story/${slug}`);

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
    "image": `https://chanakyalens.com/api/story-card/${slug}`,
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
      <NavDrawer />
      <article className="max-w-2xl mx-auto px-5 pt-7 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-wide mb-5 hover:opacity-80"
          style={{ color: "var(--text-on-ink-dim)" }}
        >
          ← Back to feed
        </Link>

        {story.imageUrl && (
          <div className="relative w-full h-56 md:h-72 rounded-sm overflow-hidden mb-6">
            <Image
              src={story.imageUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

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

        <div className="mb-5">
          <ShareButtons slug={slug} headline={story.headline} />
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

        {(story.offLens || (story.sources && story.sources.length > 0)) && (() => {
          const COUNTRY_FLAGS: Record<string, string> = {
            "AF": "🇦🇫", "AU": "🇦🇺", "AZ": "🇦🇿", "BD": "🇧🇩",
            "CN": "🇨🇳", "DE": "🇩🇪", "ES": "🇪🇸", "FR": "🇫🇷",
            "GB": "🇬🇧", "GE": "🇬🇪", "HK": "🇭🇰", "IN": "🇮🇳",
            "MA": "🇲🇦", "MY": "🇲🇾", "PH": "🇵🇭", "PK": "🇵🇰",
            "RU": "🇷🇺", "SA": "🇸🇦", "SG": "🇸🇬", "TR": "🇹🇷",
            "US": "🇺🇸", "Afghanistan": "🇦🇫", "Australia": "🇦🇺",
            "Azerbaijan": "🇦🇿", "Brazil": "🇧🇷", "Canada": "🇨🇦",
            "China": "🇨🇳", "France": "🇫🇷", "Germany": "🇩🇪",
            "Greece": "🇬🇷", "India": "🇮🇳", "Iran": "🇮🇷",
            "Iraq": "🇮🇶", "Israel": "🇮🇱", "Italy": "🇮🇹",
            "Japan": "🇯🇵", "Macedonia": "🇲🇰", "Mexico": "🇲🇽",
            "Nigeria": "🇳🇬", "Pakistan": "🇵🇰", "Philippines": "🇵🇭",
            "Singapore": "🇸🇬", "South Africa": "🇿🇦", "South Korea": "🇰🇷",
            "Spain": "🇪🇸", "Syria": "🇸🇾", "Thailand": "🇹🇭",
            "United Arab Emirates": "🇦🇪", "United Kingdom": "🇬🇧",
            "United States": "🇺🇸", "Vietnam": "🇻🇳",
          };
          const sourceCounts: Record<string, number> = {};
          (story.sources ?? []).forEach((s) => {
            const c = s.sourceCountry ?? "unknown";
            if (c && c !== "unknown") sourceCounts[c] = (sourceCounts[c] ?? 0) + 1;
          });
          const total = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
          const sorted = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
          const subjectSet = new Set(story.subjectCountries ?? []);
          const coveredSet = new Set(Object.keys(sourceCounts));
          const NON_COUNTRIES = new Set(["Global", "International", "Middle East", "Southeast Asia", "East Asia", "Central Asia", "Latin America", "Sub-Saharan Africa", "North Africa", "Eastern Europe", "Western Europe", "Gulf States", "Balkans"]);
          const missing = [...subjectSet].filter((c) => !coveredSet.has(c) && !NON_COUNTRIES.has(c));
          return (
            <section className="mt-9 mb-9 p-5 rounded-sm border" style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}>
              <div className="font-display font-bold uppercase tracking-wide text-xl mb-1.5" style={{ color: "var(--brand-soft)" }}>
                Off-Lens
              </div>
              <div className="text-[0.78rem] mb-5" style={{ color: "var(--text-on-ink-dim)" }}>
                Who is covering this — and who is not.
              </div>
              {sorted.length > 0 && (
                <div className="mb-5 space-y-2">
                  {sorted.map(([country, count]) => {
                    const pct = Math.round((count / total) * 100);
                    const flag = COUNTRY_FLAGS[country] ?? "🌐";
                    return (
                      <div key={country} className="flex items-center gap-3">
                        <span className="text-lg w-7 shrink-0">{flag}</span>
                        <span className="font-mono text-[0.68rem] w-32 shrink-0" style={{ color: "var(--text-body)" }}>{country}</span>
                        <div className="flex-1 rounded-full overflow-hidden h-1.5" style={{ background: "var(--border)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand-soft)" }} />
                        </div>
                        <span className="font-mono text-[0.68rem] w-8 text-right shrink-0" style={{ color: "var(--text-on-ink-dim)" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {missing.length > 0 && (
                <div className="mb-5">
                  <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--developing)" }}>
                    Not covered by
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {missing.map((c) => (
                      <span key={c} className="font-mono text-[0.68rem] px-2 py-0.5 rounded border" style={{ borderColor: "var(--developing)", color: "var(--developing)" }}>
                        {COUNTRY_FLAGS[c] ?? "🌐"} {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {story.offLens && (
                <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-on-ink-dim)" }}>
                    Analysis
                  </div>
                  <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-on-ink)" }}>{story.offLens}</p>
                </div>
              )}
            </section>
          );
        })()}

        {story.chanakyaAnalysis && (
          <section
            className="mt-2 mb-9 p-5 rounded-sm border-2"
            style={{ borderColor: "var(--brand-soft)", background: "#132340" }}
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
      </article>
    </>
  );
}


