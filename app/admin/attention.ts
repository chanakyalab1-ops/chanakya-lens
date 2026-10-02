import type { Overview } from "./data";

export type AttentionItem = { level: "warn" | "info"; text: string; href?: string };

const STUCK_BATCH_HOURS = 6;

// Everything on the page that deserves a look, in one list, so the first
// thing the admin sees is "all clear" or what to do -- not twenty numbers to
// interpret. Pure so it can be tested.
export function buildAttention(o: Overview, now: number = Date.now()): AttentionItem[] {
  const items: AttentionItem[] = [];
  const p = o.pipeline;

  if (o.buffer.plan.allow === 0) {
    items.push({ level: "info", text: o.buffer.message, href: o.buffer.plan.limitedBy === "buffer" ? "/review" : undefined });
  }
  if (p.factCheckFailed > 0) {
    items.push({
      level: "warn",
      text: `${p.factCheckFailed} draft${p.factCheckFailed === 1 ? "" : "s"} failed fact-check. They are in the review queue flagged as failed.`,
      href: "/review",
    });
  }
  for (const b of p.recentBatches) {
    if (b.status !== "submitted") continue;
    const hours = (now - new Date(b.created_at).getTime()) / 36e5;
    if (hours > STUCK_BATCH_HOURS) {
      items.push({
        level: "warn",
        text: `A generation batch has been "submitted" for ${Math.round(hours)}h. check-batches may not be picking it up.`,
      });
      break;
    }
  }
  if (p.candidatesPending === 0 && p.candidatesBatchPending === 0) {
    items.push({ level: "warn", text: "No candidate articles in the pipeline. Ingest (RSS or TheNewsAPI) may not be running." });
  }
  return items;
}
