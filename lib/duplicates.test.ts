import { describe, expect, it } from "vitest";
import { compareTexts, findSimilarPairs, findSimilarStory, normalizeUrl, type KnownStory } from "./duplicates";

const yemenExisting: KnownStory = {
  slug: "yemen-government-offensive",
  headline: "Yemen's government launches major offensive to recapture Houthi territory",
  state: "published",
  titles: [
    "Yemen's government launches major offensive to recapture Houthi territory",
    "Yemen government forces launch offensive against Houthis near Hodeidah",
    "Saudi-backed Yemeni forces begin push to retake Houthi-held areas",
  ],
  urls: ["https://example.com/yemen-offensive"],
};

describe("normalizeUrl", () => {
  it("ignores protocol, www, query string, fragment and trailing slash", () => {
    expect(normalizeUrl("https://www.Example.com/a/b/?utm=1#x")).toBe("example.com/a/b");
    expect(normalizeUrl("http://example.com/a/b")).toBe("example.com/a/b");
  });
});

describe("findSimilarStory", () => {
  it("flags a candidate whose articles are worded differently but cover the same event", () => {
    const candidate = {
      titles: [
        "Yemen's Saudi-backed government announces major military operation against Houthis",
        "Yemeni government forces open offensive on Houthi positions as Red Sea tensions rise",
      ],
      urls: ["https://other.com/yemen-operation"],
    };
    const hit = findSimilarStory(candidate, [yemenExisting]);
    expect(hit).toMatchObject({ slug: "yemen-government-offensive", state: "published", reason: "similar_titles" });
  });

  it("flags a candidate that reuses an article an existing story already cites", () => {
    const hit = findSimilarStory({ titles: ["Completely different wording here"], urls: ["http://www.example.com/yemen-offensive/?ref=x"] }, [yemenExisting]);
    expect(hit).toMatchObject({ reason: "shared_article", score: 1 });
  });

  it("does not flag unrelated stories that merely share a country name", () => {
    const candidate = {
      titles: ["Fed tightening pressures India's bonds and rupee as policy space narrows", "India rupee slides as US yields climb"],
      urls: [],
    };
    const known: KnownStory = {
      slug: "india-russian-oil",
      headline: "India's Russian oil pivot was necessity, not choice, deputy foreign minister says",
      state: "published",
      titles: ["India's Russian oil pivot was necessity, not choice, deputy foreign minister says", "India defends Russian crude purchases as energy security"],
      urls: [],
    };
    expect(findSimilarStory(candidate, [known])).toBeNull();
  });

  it("returns the closest of several known stories", () => {
    const other: KnownStory = { slug: "brazil", headline: "Brazil runoff", state: "published", titles: ["Brazil runoff vote begins"], urls: [] };
    const hit = findSimilarStory({ titles: ["Yemen government launches offensive to recapture Houthi territory"], urls: [] }, [other, yemenExisting]);
    expect(hit?.slug).toBe("yemen-government-offensive");
  });

  it("needs a third of a larger group's articles to match, not just one stray article", () => {
    const group = {
      titles: [
        "Yemen government launches offensive to recapture Houthi territory",
        "Brazil senate votes on pension reform bill",
        "Japan central bank holds interest rates steady",
        "Kenya opposition leaders call nationwide protests",
        "Peru congress impeachment debate continues",
        "Chile copper output falls as mine strike drags on",
      ],
      urls: [],
    };
    expect(findSimilarStory(group, [yemenExisting])).toBeNull();
  });

  it("returns null when there is nothing to compare", () => {
    expect(findSimilarStory({ titles: [], urls: [] }, [yemenExisting])).toBeNull();
    expect(findSimilarStory({ titles: ["Something happened"], urls: [] }, [])).toBeNull();
  });
});

describe("compareTexts", () => {
  it("is symmetric for shared articles", () => {
    const a = { titles: ["x y z"], urls: ["https://a.com/1"] };
    const b = { titles: ["p q r"], urls: ["https://www.a.com/1/"] };
    expect(compareTexts(a, b)?.reason).toBe("shared_article");
    expect(compareTexts(b, a)?.reason).toBe("shared_article");
  });
});

describe("findSimilarPairs", () => {
  it("lists repeated stories, strongest first, and leaves unrelated ones out", () => {
    const stories = [
      { slug: "a", headline: yemenExisting.headline, titles: yemenExisting.titles, urls: ["https://x.com/1"] },
      { slug: "b", headline: "Yemen government forces open offensive on Houthi positions", titles: ["Yemen government forces open offensive on Houthi positions", "Yemeni forces launch offensive against Houthis"], urls: ["https://y.com/2"] },
      { slug: "c", headline: "Brazil senate passes budget", titles: ["Brazil senate passes budget"], urls: [] },
    ];
    const pairs = findSimilarPairs(stories);
    expect(pairs).toHaveLength(1);
    expect([pairs[0].a.slug, pairs[0].b.slug].sort()).toEqual(["a", "b"]);
  });
});
