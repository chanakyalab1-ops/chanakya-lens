import { describe, expect, it } from "vitest";
import { buildAttention } from "./attention";
import type { Overview } from "./data";
import { planGeneration, type Backlog, type BufferSettings } from "../../lib/pipelineBuffer";
import { timeAgo } from "./time";

const NOW = new Date("2026-10-02T12:00:00Z").getTime();
const settings: BufferSettings = { buffer: 15, dailyCap: 20, perRunMax: 10, paused: false };

function overview(over: { backlog?: Partial<Backlog>; pipeline?: Partial<Overview["pipeline"]>; settings?: Partial<BufferSettings> } = {}): Overview {
  const backlog: Backlog = { factChecking: 0, inReview: 0, inFlight: 0, generated24h: 0, generated7d: 0, ...over.backlog };
  const s = { ...settings, ...over.settings };
  const plan = planGeneration(backlog, s, s.perRunMax);
  return {
    views24h: 0, views30d: 0, totalStories: 0, digestSignups: 0, feedbackCount: 0, topStories: [], recentFeedback: [],
    pipeline: {
      candidatesPending: 50, candidatesBatchPending: 0, batchesSubmitted: 0, factChecking: 0, inReview: 0,
      published: 0, rejected: 0, factCheckFailed: 0, recentBatches: [], ...over.pipeline,
    },
    buffer: { settings: s, backlog, plan, message: "msg" },
  };
}

describe("buildAttention", () => {
  it("is empty when everything is healthy", () => {
    expect(buildAttention(overview(), NOW)).toEqual([]);
  });
  it("tells you when generation is held, linking to the review queue when the buffer is full", () => {
    const items = buildAttention(overview({ backlog: { inReview: 15 } }), NOW);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ level: "info", href: "/review" });
  });
  it("flags failed fact-checks", () => {
    const items = buildAttention(overview({ pipeline: { factCheckFailed: 2 } }), NOW);
    expect(items[0].text).toContain("2 drafts failed fact-check");
  });
  it("flags a batch that has been submitted for too long, but not a fresh one or a finished one", () => {
    const old = { id: 1, anthropic_batch_id: "b", status: "submitted", created_at: "2026-10-02T03:00:00Z", processed_at: null };
    const fresh = { ...old, id: 2, created_at: "2026-10-02T11:00:00Z" };
    const done = { ...old, id: 3, status: "processed" };
    expect(buildAttention(overview({ pipeline: { recentBatches: [old] } }), NOW)[0].text).toContain("9h");
    expect(buildAttention(overview({ pipeline: { recentBatches: [fresh, done] } }), NOW)).toEqual([]);
  });
  it("flags an empty pipeline, which usually means ingest stopped", () => {
    const items = buildAttention(overview({ pipeline: { candidatesPending: 0, candidatesBatchPending: 0 } }), NOW);
    expect(items[0].text).toContain("Ingest");
  });
});

describe("timeAgo", () => {
  it("formats minutes, hours and days", () => {
    expect(timeAgo("2026-10-02T11:59:40Z", NOW)).toBe("just now");
    expect(timeAgo("2026-10-02T11:15:00Z", NOW)).toBe("45m ago");
    expect(timeAgo("2026-10-02T06:00:00Z", NOW)).toBe("6h ago");
    expect(timeAgo("2026-09-28T12:00:00Z", NOW)).toBe("4d ago");
  });
});
