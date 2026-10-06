import { describe, expect, it } from "vitest";
import { pageMeta, seoTitle } from "./seo";

describe("seoTitle", () => {
  it("keeps short headlines unchanged", () => {
    expect(seoTitle("Houthis strike Saudi oil facility")).toBe("Houthis strike Saudi oil facility");
  });
  it("cuts a long headline at a clause break when there is one", () => {
    const t = seoTitle("Houthis strike Saudi oil facility, as government forces escalate strikes on Sanaa and Hodeidah");
    expect(t).toBe("Houthis strike Saudi oil facility");
  });
  it("otherwise cuts at a word boundary with an ellipsis, within 60 characters", () => {
    const t = seoTitle("Russia launches a record drone barrage across Ukraine overnight hitting energy and rail infrastructure");
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t.endsWith("…")).toBe(true);
    expect(t).not.toMatch(/\s…$/);
  });
});

describe("pageMeta", () => {
  it("points og:url at the page and repeats the site fields", () => {
    const m = pageMeta("/regions", "Regions", "Desc");
    expect(m.openGraph).toMatchObject({ url: "/regions", siteName: "Chanakya Lens", title: "Regions" });
  });
});
