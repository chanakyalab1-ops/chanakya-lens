import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { unsubToken, verifyUnsubToken } from "./unsubscribeToken";

describe("unsubscribe token", () => {
  const old = process.env.CRON_SECRET;
  const oldU = process.env.UNSUBSCRIBE_SECRET;
  beforeEach(() => {
    delete process.env.UNSUBSCRIBE_SECRET;
    process.env.CRON_SECRET = "test-secret";
  });
  afterEach(() => {
    process.env.CRON_SECRET = old;
    if (oldU === undefined) delete process.env.UNSUBSCRIBE_SECRET;
    else process.env.UNSUBSCRIBE_SECRET = oldU;
  });
  it("accepts the right token for an address, ignoring case", () => {
    const t = unsubToken("Reader@Example.com");
    expect(verifyUnsubToken("reader@example.com", t)).toBe(true);
  });
  it("rejects another address, a wrong token and an empty one", () => {
    const t = unsubToken("a@b.co");
    expect(verifyUnsubToken("c@d.co", t)).toBe(false);
    expect(verifyUnsubToken("a@b.co", "0".repeat(32))).toBe(false);
    expect(verifyUnsubToken("a@b.co", "")).toBe(false);
    expect(verifyUnsubToken("a@b.co", null)).toBe(false);
  });
  it("accepts nothing when no secret is set", () => {
    delete process.env.CRON_SECRET;
    expect(unsubToken("a@b.co")).toBe("");
    expect(verifyUnsubToken("a@b.co", "anything")).toBe(false);
  });
});
