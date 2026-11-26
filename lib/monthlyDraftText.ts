import { periodLabel, type MonthlyStats } from "./monthlyStats";

export type DraftText = { title: string; summary: string; intro: string[]; countries: string; regions: string; chokepoints: string; effects: string; watch: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

// Reads the model's JSON, tolerating code fences around it. Null when it is not usable.
export function parseDraftText(raw: string): DraftText | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]) as Record<string, unknown>;
    const intro = Array.isArray(j.intro) ? j.intro.map((p) => str(p, 900)).filter(Boolean).slice(0, 3) : [];
    const d: DraftText = { title: str(j.title, 120), summary: str(j.summary, 300), intro, countries: str(j.countries, 900), regions: str(j.regions, 900), chokepoints: str(j.chokepoints, 900), effects: str(j.effects, 900), watch: str(j.watch, 900) };
    return d.title && d.summary && d.intro.length >= 1 && d.countries && d.watch ? d : null;
  } catch {
    return null;
  }
}

// Puts the written parts and the chart markers together. The first three blocks are the
// free preview, so they are the intro and one chart.
export function assembleBody(d: DraftText, stats: MonthlyStats): string {
  const parts: string[] = [...d.intro, "[[chart:countries]]", d.countries];
  if (stats.regions.some((r) => r.count > 0)) parts.push("## Regions", "[[chart:regions]]", d.regions || "");
  if (stats.chokepoints.length > 0) parts.push("## Chokepoints and systems", "[[chart:chokepoints]]", d.chokepoints || "");
  if (stats.effects.length > 0) parts.push("## How certain the effects were", "[[chart:effects]]", d.effects || "");
  parts.push("## What to watch next month", d.watch);
  return parts.filter((p) => p !== "").join("\n\n");
}

export function buildPrompt(stats: MonthlyStats): { system: string; user: string } {
  const system =
    "You write Lens Monthly for Chanakya Lens, a geopolitics site that explains world events by what they mean for ordinary readers, with an India-first audience. " +
    "Use ONLY the numbers and stories provided. Never invent facts, figures, dates, names or quotes, and do not bring in outside knowledge. " +
    "Do not forecast: say what to keep an eye on, not what will happen. Use plain words and short sentences. Do not use em dashes. " +
    "Answer with JSON only, with these keys: title (a plain headline for the month), summary (under 200 characters), intro (an array of 2 short paragraphs), " +
    "countries (one paragraph on the most-covered countries), regions (one paragraph on coverage by region), chokepoints (one paragraph on chokepoints and systems; empty string if none), " +
    "effects (one paragraph on how certain the effects were, using direct, likely and possible), watch (2 or 3 sentences on what to keep an eye on next month, based only on the stories). About 450 words in all.";
  const t = (rows: { name: string; count: number }[]) => rows.map((r) => `${r.name}: ${r.count}`).join("; ") || "none";
  const user =
    `Month: ${periodLabel(stats.period)}. Stories published: ${stats.total}.\n` +
    `Most-covered countries: ${t(stats.countries)}.\nStories by region: ${t(stats.regions)}.\nChokepoints and systems: ${t(stats.chokepoints)}.\n` +
    `Effects by topic (direct/likely/possible): ${stats.effects.map((e) => `${e.category} ${e.direct}/${e.likely}/${e.possible}`).join("; ") || "none"}.\n` +
    `Stories with the most direct effects:\n${stats.topStories.map((s) => `- ${s.headline} (${s.category}, ${s.direct} direct)`).join("\n")}`;
  return { system, user };
}

