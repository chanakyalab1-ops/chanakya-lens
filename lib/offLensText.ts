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

export const OFF_LENS_SYSTEM = `You write the "Analysis" note for Chanakya Lens's Off-Lens section. Its purpose is to show readers how the same story is covered differently in different countries.

You are given a story and the outlets that reported it, with each outlet's home country and the headline it ran. Write what the headlines show, in specifics:
- Contrast the countries. Name the outlets and countries, and say what each one's headline puts first: the actor it blames or credits, the number or event it leads with, the word it chooses (for example "crackdown" against "enforcement"). Use the headlines' own words or a close paraphrase.
- Say who is missing: a country with an obvious direct stake that has no outlet in the list, when several other countries do.
- The strongest finding is narrative inversion: one side runs "X attacked Y" while another runs "Y provoked X".

Rules:
- Use only the outlets, countries and headlines given. Do not say what a country or outlet "probably" or "would likely" think, and do not name a missing country unless it is plainly a direct party to the story.
- Compare at least two countries by name. If the headlines are close to identical and nobody important is missing, answer with null.
- Do not judge accuracy or political bias.
- 3 to 5 sentences of plain prose, no markdown, no citations.

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
