import { resolveSourceCountry, articleHost } from "@/lib/outletCountries";

export type OffLensInput = {
  headline: string;
  dek: string;
  subjectCountries: string[];
  sources: { url: string; title: string; domain: string; source_country: string | null }[];
};

export type OffLensSource = { outlet: string; country: string; title: string };

// Sources with the outlet's home country filled in; those it can't be told for are dropped.
export function describeSources(sources: OffLensInput["sources"]): OffLensSource[] {
  const out: OffLensSource[] = [];
  for (const s of sources) {
    const country = resolveSourceCountry(s.source_country, s.domain, s.url);
    if (!country) continue;
    out.push({ outlet: articleHost(s.url) || s.domain, country, title: s.title });
  }
  return out;
}

// Whether there is enough to compare: coverage from two or more countries.
export function hasEnoughCoverage(sources: OffLensSource[]): boolean {
  return new Set(sources.map((s) => s.country)).size >= 2;
}

export const OFF_LENS_SYSTEM = `You write the "Analysis" note for Chanakya Lens's Off-Lens section: a coverage map, not an opinion.

You are given a story and the list of outlets that reported it, with each outlet's home country and the headline it ran. Report only what that list shows:
- Coverage gap: countries with an obvious direct stake in the story that are absent, while several other countries are present.
- Framing divergence: where headlines from different countries describe the same events in clearly different terms.

Rules:
- Use only the outlets, countries and headlines given. Do not guess what an outlet or country "probably" thinks, and do not assume silence from a country you can't see.
- If the list is thin or shows no real gap or divergence, answer with null. That is the usual outcome.
- Do not judge accuracy or political bias.
- 2 to 3 plain sentences, no markdown, no citations.

Reply with JSON only: {"offLens": string | null}`;

export function buildOffLensPrompt(input: OffLensInput, sources: OffLensSource[]): string {
  const lines = sources.map((s, i) => `${i + 1}. ${s.outlet} (${s.country}): "${s.title}"`).join("\n");
  return [
    `Story: ${input.headline}`,
    `Summary: ${input.dek}`,
    `Countries the story is about: ${input.subjectCountries.join(", ") || "not stated"}`,
    "",
    "Outlets that covered it:",
    lines,
  ].join("\n");
}

// Pulls {"offLens": ...} out of the model's reply; null for anything unusable.
export function parseOffLens(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { offLens?: unknown };
    if (typeof parsed.offLens !== "string") return null;
    const note = parsed.offLens.trim();
    return note.length >= 20 ? note : null;
  } catch {
    return null;
  }
}
