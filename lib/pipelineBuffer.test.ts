import { describe, expect, it } from "vitest";
import { describePlan, planGeneration, readBufferSettings, unreviewed, type Backlog, type BufferSettings } from "./pipelineBuffer";

const settings: BufferSettings = { buffer: 15, dailyCap: 20, perRunMax: 10, paused: false };
const backlog = (over: Partial<Backlog> = {}): Backlog => ({
  factChecking: 0, inReview: 0, inFlight: 0, generated24h: 0, generated7d: 0, ...over,
});

describe("readBufferSettings", () => {
  it("has conservative defaults", () => {
    expect(readBufferSettings({})).toEqual({ buffer: 15, dailyCap: 20, perRunMax: 10, paused: false });
  });
  it("reads env overrides, including 0, and ignores junk", () => {
    expect(readBufferSettings({ PIPELINE_BUFFER: "8", PIPELINE_DAILY_CAP: "0", PIPELINE_RUN_MAX: "abc", PIPELINE_PAUSED: "1" }))
      .toEqual({ buffer: 8, dailyCap: 0, perRunMax: 10, paused: true });
    expect(readBufferSettings({ PIPELINE_BUFFER: "-3", PIPELINE_PAUSED: "true" }).buffer).toBe(15);
  });
});

describe("planGeneration", () => {
  it("allows the per-run maximum when there is plenty of room", () => {
    const p = planGeneration(backlog(), settings, 40);
    expect(p).toMatchObject({ allow: 10, limitedBy: "run", room: 15 });
  });
  it("counts fact-checking, review and in-flight stories against the buffer", () => {
    const b = backlog({ factChecking: 3, inReview: 6, inFlight: 2 });
    expect(unreviewed(b)).toBe(11);
    expect(planGeneration(b, settings, 40)).toMatchObject({ allow: 4, limitedBy: "buffer", room: 4 });
  });
  it("skips the run when the buffer is full", () => {
    const p = planGeneration(backlog({ inReview: 15 }), settings, 40);
    expect(p).toMatchObject({ allow: 0, limitedBy: "buffer" });
  });
  it("skips the run at the daily cap even with an empty backlog", () => {
    const p = planGeneration(backlog({ generated24h: 20 }), settings, 40);
    expect(p).toMatchObject({ allow: 0, limitedBy: "daily" });
  });
  it("takes the tighter of buffer and daily room", () => {
    const p = planGeneration(backlog({ generated24h: 18 }), settings, 40);
    expect(p).toMatchObject({ allow: 2, limitedBy: "daily", room: 2 });
  });
  it("paused stops everything", () => {
    expect(planGeneration(backlog(), { ...settings, paused: true }, 40)).toMatchObject({ allow: 0, limitedBy: "paused" });
  });
  it("does not report a limit when the request already fits", () => {
    expect(planGeneration(backlog(), settings, 5)).toMatchObject({ allow: 5, limitedBy: null });
  });
});

describe("describePlan", () => {
  it("explains why it is closed and how to reopen", () => {
    const b = backlog({ inReview: 15 });
    const msg = describePlan(planGeneration(b, settings, 40), b, settings);
    expect(msg).toContain("Buffer full");
    expect(msg).toContain("15 of 15");
  });
  it("says how much room is left when open", () => {
    const msg = describePlan(planGeneration(backlog(), settings, 40), backlog(), settings);
    expect(msg).toContain("room for 15");
  });
  it("does not say the buffer is full while there is still room", () => {
    const b = backlog({ inReview: 12 });
    const msg = describePlan(planGeneration(b, settings, 40), b, settings);
    expect(msg).not.toContain("Buffer full");
    expect(msg).toContain("nearly full");
    expect(msg).toContain("room for 3");
  });
});
