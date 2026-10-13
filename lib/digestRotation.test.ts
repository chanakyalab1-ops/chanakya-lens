import { describe, expect, it } from "vitest";
import { cohortCount, dayIndex, hashEmail, isSendDay } from "./digestRotation";

const emails = (n: number) => Array.from({ length: n }, (_, i) => `reader${i}@example.com`);

describe("cohortCount", () => {
  it("keeps one group while everyone fits under the limit", () => {
    expect(cohortCount(80, 100)).toBe(1);
    expect(cohortCount(85, 100)).toBe(1);
  });
  it("adds groups as the list outgrows the daily limit", () => {
    expect(cohortCount(105, 100)).toBe(2);
    expect(cohortCount(400, 100)).toBe(5);
  });
  it("never returns less than one group", () => {
    expect(cohortCount(0, 100)).toBe(1);
    expect(cohortCount(10, 0)).toBeGreaterThanOrEqual(1);
  });
});

describe("isSendDay", () => {
  it("sends to everyone when there is a single group", () => {
    expect(emails(50).every((e) => isSendDay(e, 1, 12345))).toBe(true);
  });

  it("is case-insensitive and stable for the same address", () => {
    expect(hashEmail("Reader@Example.com ")).toBe(hashEmail("reader@example.com"));
  });

  it("gives every subscriber exactly one send day per cycle, and keeps each day under the limit", () => {
    const list = emails(105);
    const groups = cohortCount(list.length, 100);
    const perDay = Array.from({ length: groups }, (_, d) => list.filter((e) => isSendDay(e, groups, d)).length);
    expect(perDay.reduce((a, b) => a + b, 0)).toBe(list.length);
    for (const n of perDay) expect(n).toBeLessThanOrEqual(100);
  });
});

describe("dayIndex", () => {
  it("advances once per UTC day", () => {
    const t = Date.UTC(2026, 9, 13, 6, 0, 0);
    expect(dayIndex(t + 86_400_000)).toBe(dayIndex(t) + 1);
    expect(dayIndex(t + 3_600_000)).toBe(dayIndex(t));
  });
});
