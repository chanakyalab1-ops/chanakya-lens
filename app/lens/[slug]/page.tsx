import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavDrawer from "@/components/NavDrawer";
import { CompactCard, MobileRow } from "@/components/Feed";
import { getAllStories } from "@/lib/stories";
import { ALL_ENTITIES, coverageCounts, getLensEntity, isThinCountry, storiesFor, type LensKind } from "@/lib/lens";

export const revalidate = 3600;

// Build the curated pages (systems, actors, themes) up front. Country pages
// are rendered the first time someone opens them, so the deploy stays quick
// and an empty country page never gets built or listed.
export function generateStaticParams() {
  return ALL_ENTITIES.filter((e) => e.kind !== "country").map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entity = getLensEntity(slug);
  if (!entity) return {};
  const description = entity.primer?.[0] ?? `Latest Chanakya Lens coverage of ${entity.name}, and which countries are reporting it.`;
  // Keep thin country pages out of search results until they have real coverage.
  const thin = isThinCountry(entity, storiesFor(entity, await getAllStories()).length);
  return { ...pageMeta(`/lens/${slug}`, `${entity.name} | The Lens`, description), robots: thin ? { index: false, follow: true } : undefined };
}

const KIND_LABEL: Record<LensKind, string> = { system: "Strategic system", actor: "Actor", country: "Country", theme: "Storyline" };
const SHOWN = 24;

export default async function LensEntityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = getLensEntity(slug);
  if (!entity) notFound();

  const stories = await getAllStories();
  const matched = storiesFor(entity, stories);
  const shown = matched.slice(0, SHOWN);
  const coverage = coverageCounts(matched).slice(0, 8);
  const totalSources = coverage.reduce((n, [, c]) => n + c, 0);
  const related = (entity.related ?? []).map(getLensEntity).filter((e): e is NonNullable<typeof e> => !!e);

  return (
    <>
      <NavDrawer />
      <main className="max-w-6xl mx-auto px-5 pt-6 pb-16">
        <Link href="/lens" className="font-mono text-[0.68rem] uppercase tracking-wide hover:opacity-80" style={{ color: "var(--text-on-ink-dim)" }}>
          ← The Lens
        </Link>

        <header className="mt-4 mb-7 max-w-2xl">
          <div className="font-mono text-[0.68rem] uppercase tracking-wide mb-2.5" style={{ color: "var(--brand-soft)" }}>
            {KIND_LABEL[entity.kind]}
          </div>
          <h1 className="font-display font-extrabold uppercase text-4xl md:text-5xl leading-none" style={{ color: "var(--text-on-ink)" }}>
            {entity.name}
          </h1>
          {entity.tagline && (
            <p className="mt-3 text-base" style={{ color: "var(--text-body)" }}>{entity.tagline}</p>
          )}
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:items-start">
          <div>
            {entity.primer && (
              <section className="mb-8 max-w-2xl">
                <h2 className="font-display font-bold text-lg mb-2" style={{ color: "var(--brand-soft)" }}>The basics</h2>
                {entity.primer.map((p, i) => (
                  <p key={i} className="text-[0.95rem] leading-relaxed mb-3" style={{ color: "var(--text-body)" }}>{p}</p>
                ))}
              </section>
            )}

            {entity.whyItMatters && (
              <section className="mb-8 max-w-2xl p-4 md:p-5 rounded-sm border-2" style={{ borderColor: "var(--brand-soft)", background: "var(--surface-strong)" }}>
                <h2 className="font-display font-bold text-lg mb-1.5" style={{ color: "var(--brand-soft)" }}>Why it matters</h2>
                <p className="text-[0.92rem] leading-relaxed" style={{ color: "var(--text-on-ink)" }}>{entity.whyItMatters}</p>
              </section>
            )}

            <section>
              <h2 className="font-display font-bold text-lg mb-3" style={{ color: "var(--brand-soft)" }}>
                Latest coverage
                <span className="ml-2 font-mono text-[0.62rem] font-normal" style={{ color: "var(--text-on-ink-dim)" }}>{matched.length}</span>
              </h2>
              {shown.length === 0 ? (
                <p className="text-[0.9rem]" style={{ color: "var(--text-on-ink-dim)" }}>
                  No stories on this yet. They will appear here as soon as we publish one.
                </p>
              ) : (
                <>
                  <div className="md:hidden">
                    {shown.map((s) => <MobileRow key={s.slug} story={s} />)}
                  </div>
                  <div className="hidden md:grid md:grid-cols-2 gap-2.5">
                    {shown.map((s) => <CompactCard key={s.slug} story={s} />)}
                  </div>
                  {matched.length > SHOWN && (
                    <p className="font-mono text-[0.68rem] mt-3" style={{ color: "var(--text-on-ink-dim)" }}>
                      Showing the latest {SHOWN} of {matched.length}.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>

          <aside className="mt-9 lg:mt-0 lg:sticky lg:top-4 space-y-6">
            {coverage.length > 0 && (
              <section className="p-4 rounded-sm border" style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}>
                <h2 className="font-display font-bold text-lg mb-1" style={{ color: "var(--brand-soft)" }}>Who is covering it</h2>
                <p className="text-[0.75rem] mb-3" style={{ color: "var(--text-on-ink-dim)" }}>
                  Outlets by country across these stories.
                </p>
                <div className="space-y-2.5">
                  {coverage.map(([country, n]) => (
                    <div key={country} className="flex items-center gap-3">
                      <span className="font-mono text-[0.68rem] w-24 shrink-0 truncate" style={{ color: "var(--text-body)" }}>{country}</span>
                      <div className="flex-1 rounded-full overflow-hidden h-1.5" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.round((n / totalSources) * 100)}%`, background: "var(--brand-soft)" }} />
                      </div>
                      <span className="font-mono text-[0.65rem] w-6 text-right shrink-0" style={{ color: "var(--text-on-ink-dim)" }}>{n}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {related.length > 0 && (
              <section>
                <h2 className="font-mono text-[0.62rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-on-ink-dim)" }}>Related</h2>
                <div className="flex flex-wrap gap-2">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/lens/${r.slug}`}
                      className="font-mono text-[0.72rem] px-3 py-1.5 rounded-full border hover:opacity-80"
                      style={{ borderColor: "var(--border)", color: "var(--text-body)" }}
                    >
                      {r.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
