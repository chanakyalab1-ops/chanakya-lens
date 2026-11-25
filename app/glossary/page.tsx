import type { Metadata } from 'next';
import Link from 'next/link';
import NavDrawer from '@/components/NavDrawer';
import { pageMeta } from '@/lib/seo';
import { GLOSSARY } from '@/lib/glossary';
import { getLensEntity } from '@/lib/lens';

export const metadata: Metadata = pageMeta(
  '/glossary',
  'Geopolitics glossary: plain-language definitions | Chanakya Lens',
  'Plain-language definitions of the terms used in world news: chokepoint, sanctions, tariff, LNG, SWIFT, proxy war and more, with the stories where they matter.',
);

export default function GlossaryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Chanakya Lens geopolitics glossary',
    url: 'https://chanakyalens.com/glossary',
    hasDefinedTerm: GLOSSARY.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.definition,
      url: `https://chanakyalens.com/glossary#${t.slug}`,
    })),
  };
  const letters = Array.from(new Set(GLOSSARY.map((t) => t.term[0].toUpperCase())));

  return (
    <>
      <NavDrawer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-3xl mx-auto px-5 pt-8 pb-20">
        <h1 className="font-display font-extrabold text-4xl mb-2">Glossary</h1>
        <p className="text-[1rem] leading-relaxed mb-6" style={{ color: 'var(--text-body)' }}>
          The terms our stories use, in plain words. Each links to the places in the news where it comes up.
        </p>
        <nav aria-label="Jump to letter" className="flex flex-wrap gap-2 mb-8">
          {letters.map((l) => (
            <a key={l} href={`#letter-${l}`} className="font-mono text-[0.75rem] w-8 h-8 flex items-center justify-center rounded-sm border hover:opacity-80" style={{ borderColor: 'var(--border)' }}>{l}</a>
          ))}
        </nav>
        <dl>
          {letters.map((l) => (
            <section key={l} id={`letter-${l}`} className="mb-8 scroll-mt-24">
              <h2 className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--brand-soft)' }}>{l}</h2>
              {GLOSSARY.filter((t) => t.term[0].toUpperCase() === l).map((t) => (
                <div key={t.slug} id={t.slug} className="py-3 border-t scroll-mt-24" style={{ borderColor: 'var(--border)' }}>
                  <dt className="font-display font-bold text-lg">{t.term}</dt>
                  <dd className="text-[0.95rem] leading-relaxed mt-1" style={{ color: 'var(--text-body)' }}>
                    {t.definition}
                    {(t.lens || t.see) && (
                      <span className="block mt-2 font-mono text-[0.6875rem] uppercase tracking-wide">
                        {t.see && (
                          <Link href={t.see.href} className="underline mr-4" style={{ color: 'var(--brand-soft)' }}>{t.see.label}</Link>
                        )}
                        {(t.lens ?? []).map((slug) => {
                          const e = getLensEntity(slug);
                          return e ? (
                            <Link key={slug} href={`/lens/${slug}`} className="underline mr-4" style={{ color: 'var(--brand-soft)' }}>{e.name}</Link>
                          ) : null;
                        })}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </section>
          ))}
        </dl>
      </main>
    </>
  );
}
