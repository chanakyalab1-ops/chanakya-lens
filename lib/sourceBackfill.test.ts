import { describe, expect, it } from "vitest";
import { buildQuery, headlineKeywords, matchHits, countryCounts, nextOffset } from "./sourceBackfill";
import { parseGoogleNews, type NewsHit } from "./googleNews";
import { canonicalDomain, countryForDomain, isAggregator, resolveSourceCountry, articleHost } from "./outletCountries";

const HEADLINE = "Pakistan launches deadly air strikes on Afghanistan after border clash";
const CREATED = "2026-10-01T10:00:00.000Z";

function hit(partial: Partial<NewsHit> & Pick<NewsHit, "title" | "domain">): NewsHit {
  return { url: `https://news.google.com/rss/articles/${partial.domain}`, outlet: partial.domain, publishedAt: "2026-10-01T12:00:00.000Z", ...partial };
}

describe("title-case headlines and false matches", () => {
  it("picks countries, not every capitalised word, from a Title Case headline", () => {
    const q = headlineKeywords("Pakistan Pitches Its War Legacy to US Afghanistan Commission");
    expect(q).toContain("Pakistan");
    expect(q).toContain("Afghanistan");
    expect(q).not.toContain("Pitches Its");
  });
  it("no longer matches on a country plus a filler word", () => {
    const headline = "Pakistan Pitches Its War Legacy to US Afghanistan Commission";
    const hits = [
      hit({ title: "Pakistan At UN: Credibility Gap Exposes Hollowness Of Its Peace Pitch", domain: "news18.com" }),
      hit({ title: "J-10CE in Azerbaijani Colours: China Pitches Its Fighter at ADEX 2026", domain: "migflug.com" }),
    ];
    expect(matchHits(headline, CREATED, hits, new Set(), 10)).toEqual([]);
  });
  it("uses acronyms as search terms in Title Case headlines", () => {
    expect(headlineKeywords("Trump Announces $54B South Korean Alaska LNG Investment Ahead of Midterms")).toContain("LNG");
  });
  it("can narrow a query to fewer terms", () => {
    expect(buildQuery(HEADLINE, CREATED, 2).split(" after:")[0].split(" ")).toHaveLength(2);
  });
  it("does not treat .co as Colombia", () => {
    expect(countryForDomain("briefs.co")).toBe("");
  });
  it("knows outlets that showed up unmapped in the first dry run", () => {
    expect(countryForDomain("time.com")).toBe("United States");
    expect(countryForDomain("wionews.com")).toBe("India");
  });
});

describe("headlineKeywords / buildQuery", () => {
  it("searches on names and places", () => {
    expect(headlineKeywords("Pakistan launches deadly strikes on Afghanistan after Taliban border clash")).toBe("Pakistan Afghanistan Taliban");
  });
  it("falls back to the longest words when the headline has no names", () => {
    expect(headlineKeywords("deadly strikes escalate across disputed frontier")).toContain("frontier");
  });
  it("adds a date window around the story", () => {
    expect(buildQuery(HEADLINE, CREATED)).toMatch(/after:2026-09-27 before:2026-10-06$/);
  });
});

describe("parseGoogleNews", () => {
  it("reads the publisher from <source> and strips the outlet suffix", () => {
    const xml = `<rss><channel><item>
      <title>Pakistan launches deadly air strikes on Afghanistan - BBC</title>
      <link>https://news.google.com/rss/articles/abc</link>
      <pubDate>Thu, 01 Oct 2026 08:06:00 GMT</pubDate>
      <source url="https://www.bbc.com">BBC</source></item></channel></rss>`;
    expect(parseGoogleNews(xml)).toEqual([
      { title: "Pakistan launches deadly air strikes on Afghanistan", url: "https://news.google.com/rss/articles/abc", domain: "bbc.com", outlet: "BBC", publishedAt: "2026-10-01T08:06:00.000Z" },
    ]);
  });
  it("skips items without a publisher", () => {
    expect(parseGoogleNews(`<item><title>x</title><link>https://a.com</link></item>`)).toEqual([]);
  });
});

describe("matchHits", () => {
  const hits = [
    hit({ title: "Pakistan launches deadly air strikes on Afghanistan", domain: "bbc.com" }),
    hit({ title: "Pakistan air strikes hit Afghanistan border regions", domain: "dawn.com" }),
    hit({ title: "Pakistan air strikes hit Afghanistan border regions again", domain: "dawn.com" }),
    hit({ title: "Germany faces winter with lowest gas storage in years", domain: "dw.com" }),
    hit({ title: "Pakistan launches deadly air strikes on Afghanistan", domain: "old.com", publishedAt: "2026-08-01T00:00:00.000Z" }),
    hit({ title: "Pakistan launches deadly air strikes on Afghanistan", domain: "already.com" }),
  ];

  it("keeps same-story articles inside the date window, one per outlet", () => {
    const m = matchHits(HEADLINE, CREATED, hits, new Set(["already.com"]), 10);
    expect(m.map((x) => x.domain).sort()).toEqual(["bbc.com", "dawn.com"]);
  });
  it("fills in the outlet's country", () => {
    const m = matchHits(HEADLINE, CREATED, hits, new Set(), 10);
    expect(m.find((x) => x.domain === "dawn.com")?.source_country).toBe("Pakistan");
  });
  it("respects the room left", () => {
    expect(matchHits(HEADLINE, CREATED, hits, new Set(), 1)).toHaveLength(1);
    expect(matchHits(HEADLINE, CREATED, hits, new Set(), 0)).toEqual([]);
  });
});

describe("countryForDomain / countryCounts", () => {
  it("resolves known outlets, wire services and country-code domains", () => {
    expect(countryForDomain("https://www.dawn.com/x")).toBe("Pakistan");
    expect(countryForDomain("reuters.com")).toBe("United Kingdom");
    expect(countryForDomain("somepaper.co.za")).toBe("South Africa");
    expect(countryForDomain("randomsite.com")).toBe("");
  });
  it("counts countries and ignores unknowns", () => {
    expect(countryCounts([{ source_country: "India" }, { source_country: "India" }, { source_country: null }])).toEqual({ India: 2 });
  });
});

describe("canonicalDomain / aggregators", () => {
  it("merges mobile, AMP and alias domains", () => {
    expect(canonicalDomain("amp.dw.com")).toBe("dw.com");
    expect(canonicalDomain("https://www.bbc.co.uk/news")).toBe("bbc.com");
  });
  it("recognises aggregators, including their subdomains", () => {
    expect(isAggregator("news.yahoo.com")).toBe(true);
    expect(isAggregator("aol.com")).toBe(true);
    expect(isAggregator("dawn.com")).toBe(false);
  });
  it("matchHits drops aggregators and counts bbc.co.uk and bbc.com once", () => {
    const hits = [
      hit({ title: "Pakistan launches deadly air strikes on Afghanistan", domain: "bbc.com" }),
      hit({ title: "Pakistan launches deadly air strikes on Afghanistan", domain: "bbc.co.uk" }),
      hit({ title: "Pakistan launches deadly air strikes on Afghanistan", domain: "aol.com" }),
    ];
    expect(matchHits(HEADLINE, CREATED, hits, new Set(), 10).map((m) => m.domain)).toEqual(["bbc.com"]);
    expect(matchHits(HEADLINE, CREATED, hits, new Set(["bbc.com"]), 10)).toEqual([]);
  });
});

describe("nextOffset", () => {
  const row = (before: number, after: number, written: boolean) => ({ before, after, written });

  it("dry run: moves past the whole batch", () => {
    expect(nextOffset(0, [row(1, 15, false), row(1, 1, false)], false, 8, 100)).toBe(2);
  });
  it("apply: stories that reached the minimum drop out, so they don't advance the offset", () => {
    // two topped up to 15, one found nothing and stays eligible
    expect(nextOffset(0, [row(1, 15, true), row(1, 15, true), row(1, 1, false)], true, 8, 100)).toBe(1);
  });
  it("apply: a failed write keeps the story eligible", () => {
    expect(nextOffset(0, [row(1, 15, false)], true, 8, 100)).toBe(1);
  });
  it("apply: a story topped up but still under the minimum stays eligible", () => {
    expect(nextOffset(0, [row(1, 4, true)], true, 8, 100)).toBe(1);
  });
  it("returns null when nothing is left", () => {
    expect(nextOffset(0, [row(1, 15, true)], true, 8, 1)).toBeNull();
    expect(nextOffset(95, [row(1, 1, false), row(1, 1, false), row(1, 1, false), row(1, 1, false), row(1, 1, false)], false, 8, 100)).toBeNull();
  });
});

describe("resolveSourceCountry", () => {
  it("keeps a recorded country", () => {
    expect(resolveSourceCountry("India", "bbc.com")).toBe("India");
  });
  it("falls back to the outlet's home country when none was stored", () => {
    expect(resolveSourceCountry(null, "www.thelocal.it")).toBe("Italy");
    expect(resolveSourceCountry("unknown", "swissinfo.ch")).toBe("Switzerland");
  });
  it("returns null when the outlet's country can't be told", () => {
    expect(resolveSourceCountry("", "example.com")).toBeNull();
  });
});

describe("articleHost", () => {
  it("uses the article's own host, not the feed host stored with it", () => {
    expect(resolveSourceCountry(null, "feeds.thelocal.com", "https://www.thelocal.it/20261001/x")).toBe("Italy");
    expect(articleHost("https://www.thelocal.it/20261001/x")).toBe("thelocal.it");
  });
  it("ignores aggregator links and bad URLs", () => {
    expect(articleHost("https://news.google.com/rss/articles/abc")).toBe("");
    expect(articleHost("not a url")).toBe("");
  });
});
