import type { Source } from "@/lib/stories";

const COUNTRY_FLAGS: Record<string, string> = {
  "Afghanistan": "AF", "Australia": "AU", "Azerbaijan": "AZ",
  "Brazil": "BR", "Canada": "CA", "China": "CN", "France": "FR",
  "Germany": "DE", "Greece": "GR", "Hong Kong": "HK", "India": "IN",
  "Iran": "IR", "Iraq": "IQ", "Israel": "IL", "Italy": "IT",
  "Japan": "JP", "Jordan": "JO", "Kazakhstan": "KZ", "Lebanon": "LB",
  "Malaysia": "MY", "Mexico": "MX", "Morocco": "MA", "Nigeria": "NG",
  "Pakistan": "PK", "Philippines": "PH", "Qatar": "QA", "Russia": "RU",
  "Saudi Arabia": "SA", "Singapore": "SG", "South Africa": "ZA",
  "South Korea": "KR", "Spain": "ES", "Syria": "SY", "Taiwan": "TW",
  "Thailand": "TH", "Turkey": "TR", "UAE": "AE", "Ukraine": "UA",
  "United Arab Emirates": "AE", "United Kingdom": "GB",
  "United States": "US", "Vietnam": "VN", "Yemen": "YE",
};

function countryToEmoji(country: string): string {
  const code = COUNTRY_FLAGS[country];
  if (!code) return "🌐";
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
}

const NON_COUNTRIES = new Set([
  "Global", "International", "Middle East", "Southeast Asia",
  "East Asia", "Central Asia", "Latin America", "Sub-Saharan Africa",
  "North Africa", "Eastern Europe", "Western Europe", "Gulf States", "Balkans"
]);

export function OffLensSection({
  sources,
  subjectCountries,
  offLens,
}: {
  sources?: { sourceCountry: string | null; domain: string; title: string; url: string }[];
  subjectCountries?: string[];
  offLens?: string;
}) {
  const validSources = (sources ?? []).filter((s) => s.sourceCountry && s.sourceCountry !== "unknown" && s.sourceCountry !== "");
  const total = validSources.length;

  const sourceCounts: Record<string, number> = {};
  validSources.forEach((s) => {
    const c = s.sourceCountry!;
    sourceCounts[c] = (sourceCounts[c] ?? 0) + 1;
  });

  const sorted = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const subjectSet = new Set((subjectCountries ?? []).filter((c) => !NON_COUNTRIES.has(c)));
  const coveredSet = new Set(Object.keys(sourceCounts));
  const missing = [...subjectSet].filter((c) => !coveredSet.has(c));

  const hasData = total > 0 || missing.length > 0 || offLens;
  if (!hasData) return null;

  return (
    <section className="mt-9 mb-9 p-5 rounded-sm border" style={{ borderColor: "var(--border)", background: "var(--ink-card)" }}>
      <div className="font-display font-bold uppercase tracking-wide text-xl mb-1" style={{ color: "var(--brand-soft)" }}>
        Off-Lens
      </div>
      <div className="text-[0.78rem] mb-5" style={{ color: "var(--text-on-ink-dim)" }}>
        Who is covering this — and who is not.
      </div>

      {total > 0 && (
        <div className="mb-6">
          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "var(--text-on-ink-dim)" }}>
            <span>{total} source{total !== 1 ? "s" : ""} reviewed</span>
          </div>
          <div className="space-y-2.5">
            {sorted.map(([country, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={country} className="flex items-center gap-3">
                  <span className="text-base w-6 shrink-0">{countryToEmoji(country)}</span>
                  <span className="font-mono text-[0.68rem] w-28 shrink-0 truncate" style={{ color: "var(--text-body)" }}>{country}</span>
                  <div className="flex-1 rounded-full overflow-hidden h-1.5" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--brand-soft)" }} />
                  </div>
                  <span className="font-mono text-[0.65rem] w-8 text-right shrink-0" style={{ color: "var(--text-on-ink-dim)" }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {validSources.map((s, i) => (
              
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                title={s.title}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[0.65rem] font-mono hover:opacity-80 truncate max-w-[160px]"
                style={{ borderColor: "var(--border)", color: "var(--text-on-ink-dim)" }}
              >
                <span>{countryToEmoji(s.sourceCountry!)}</span>
                <span className="truncate">{s.domain.replace("www.", "")}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="mb-5">
          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--developing)" }}>
            Perspectives not in sources
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] px-2.5 py-1 rounded border" style={{ borderColor: "var(--developing)", color: "var(--developing)" }}>
                {countryToEmoji(c)} {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {offLens && (
        <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="font-mono text-[0.6rem] uppercase tracking-widest mb-2" style={{ color: "var(--text-on-ink-dim)" }}>
            Analysis
          </div>
          <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--text-on-ink)" }}>{offLens}</p>
        </div>
      )}
    </section>
  );
}