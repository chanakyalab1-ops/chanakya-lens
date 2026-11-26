import { describe, expect, it } from "vitest";
import { assembleBody, parseDraftText } from "./monthlyDraftText";
import { parseBlocks, previewBlocks } from "./miniMarkdown";
import type { MonthlyStats } from "./monthlyStats";

const good = { title: "November in the Lens", summary: "A busy month.", intro: ["One.", "Two."], countries: "Iran led.", regions: "Asia led.", chokepoints: "Hormuz.", effects: "Mostly likely.", watch: "Watch talks." };
const stats = { period: "2026-11", total: 20, countries: [{ name: "Iran", count: 5 }], chokepoints: [{ name: "Strait of Hormuz", count: 3 }], effects: [{ category: "Resources", direct: 1, likely: 2, possible: 1 }], regions: [{ name: "Asia", count: 4 }], leastCovered: null, topStories: [] } as MonthlyStats;

describe("parseDraftText", () => {
  it("reads JSON even inside code fences", () => {
    expect(parseDraftText("```json\n" + JSON.stringify(good) + "\n```")?.title).toBe("November in the Lens");
  });
  it("rejects missing or broken output", () => {
    expect(parseDraftText("no json here")).toBeNull();
    expect(parseDraftText(JSON.stringify({ ...good, title: "" }))).toBeNull();
    expect(parseDraftText("{not json}")).toBeNull();
  });
});

describe("assembleBody", () => {
  it("puts the intro and the first chart in the free preview", () => {
    const blocks = parseBlocks(assembleBody(good, stats));
    expect(previewBlocks(blocks).map((b) => b.t)).toEqual(["p", "p", "chart"]);
  });
  it("skips sections that have no data", () => {
    const body = assembleBody(good, { ...stats, chokepoints: [], effects: [] });
    expect(body).not.toContain("[[chart:chokepoints]]");
    expect(body).not.toContain("[[chart:effects]]");
    expect(body).toContain("## What to watch next month");
  });
});
