import { describe, expect, it } from "vitest";
import { isOffTopic, isSportsPower } from "./ingestFilters";

describe("isSportsPower", () => {
  it("keeps sport that meets power", () => {
    expect(isSportsPower("Russia ban from Olympics extended over sanctions")).toBe(true);
    expect(isSportsPower("Saudi sovereign wealth fund bids to host World Cup 2034")).toBe(true);
    expect(isSportsPower("Government minister calls for Asia Cup boycott")).toBe(true);
  });
  it("drops plain sport and plain politics", () => {
    expect(isSportsPower("Arsenal beat Chelsea in Premier League thriller")).toBe(false);
    expect(isSportsPower("Finance minister presents budget")).toBe(false);
    expect(isSportsPower("India win T20 World Cup final")).toBe(false);
  });
  it("matches whole words only", () => {
    expect(isSportsPower("Bandwidth for iocane powder")).toBe(false);
  });
});

describe("isOffTopic", () => {
  it("still drops ordinary sport and entertainment", () => {
    expect(isOffTopic("IPL live score: Mumbai vs Chennai")).toBe(true);
    expect(isOffTopic("Bollywood box office report")).toBe(true);
  });
  it("lets sport-meets-power through", () => {
    expect(isOffTopic("Premier League club sold to Saudi-backed sovereign wealth fund after government approval")).toBe(false);
  });
});
