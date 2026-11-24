import { tokenize } from "./clustering";

export const ASK_DAILY_LIMIT = 5;
export const ASK_GLOBAL_DAILY_LIMIT = 150;
export const QUESTION_MAX = 300;

export type AskStory = { slug: string; headline: string; dek: string; category: string; chanakyaAnalysis?: string };

export function cleanQuestion(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, QUESTION_MAX) : "";
}

// The stories whose wording overlaps the question most. Nothing is returned when
// no story shares a meaningful word, so unrelated questions never reach the model.
export function pickRelevant<T extends AskStory>(question: string, stories: T[], n = 5): T[] {
  const q = tokenize(question);
  if (q.size === 0) return [];
  return stories
    .map((s) => {
      const text = tokenize(`${s.headline} ${s.dek} ${s.category} ${s.chanakyaAnalysis ?? ""}`);
      let hits = 0;
      for (const t of q) if (text.has(t)) hits++;
      return { s, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, n)
    .map((x) => x.s);
}

export function buildAskPrompt(question: string, stories: AskStory[]): { system: string; user: string } {
  const system =
    "You answer reader questions using ONLY the Chanakya Lens stories provided. " +
    "Never use outside knowledge and never invent facts. If the stories do not answer the question, say so plainly. " +
    "Keep the answer under 150 words. After each claim cite the story as [slug] using the exact slug given.";
  const user =
    `Question: ${question}\n\nStories:\n` +
    stories.map((s) => `[${s.slug}] ${s.headline}\n${s.dek}\n${(s.chanakyaAnalysis ?? "").slice(0, 600)}`).join("\n\n");
  return { system, user };
}

// The cited stories that were actually provided, in order of first citation.
export function citedSlugs(answer: string, provided: AskStory[]): string[] {
  const ok = new Set(provided.map((s) => s.slug));
  const out: string[] = [];
  for (const m of answer.matchAll(/\[([a-z0-9-]+)\]/g)) if (ok.has(m[1]) && !out.includes(m[1])) out.push(m[1]);
  return out;
}
