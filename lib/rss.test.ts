import { describe, expect, it } from "vitest";
import { parseFeed } from "./rss";
import { isOffTopic } from "./ingestFilters";

describe("parseFeed", () => {
  it("parses RSS 2.0 items, CDATA and entities", () => {
    const xml = `<rss><channel><item>
      <title><![CDATA[Pakistan &amp; Afghanistan trade fire &#8217;again&#8217;]]></title>
      <link>https://example.com/a?utm_source=rss&amp;id=7</link>
      <pubDate>Wed, 01 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
    const [item] = parseFeed(xml);
    expect(item.title).toBe("Pakistan & Afghanistan trade fire \u2019again\u2019");
    expect(item.url).toBe("https://example.com/a?id=7");
    expect(item.publishedAt).toBe("2026-10-01T10:00:00.000Z");
  });

  it("parses Atom entries with href links", () => {
    const xml = `<feed><entry><title>Atom story</title>
      <link rel="alternate" href="https://example.com/atom"/>
      <updated>2026-10-01T08:30:00Z</updated></entry></feed>`;
    expect(parseFeed(xml)).toEqual([
      { title: "Atom story", url: "https://example.com/atom", publishedAt: "2026-10-01T08:30:00.000Z" },
    ]);
  });

  it("parses RSS 1.0 (RDF) items with dc:date", () => {
    const xml = `<rdf:RDF><item><title>Rdf story</title><link>https://example.com/r</link>
      <dc:date>2026-10-01T06:00:00Z</dc:date></item></rdf:RDF>`;
    expect(parseFeed(xml)[0].publishedAt).toBe("2026-10-01T06:00:00.000Z");
  });

  it("skips items with no title or no usable link", () => {
    const xml = `<rss><item><link>https://example.com/x</link></item>
      <item><title>No link</title></item>
      <item><title>Bad link</title><link>javascript:alert(1)</link></item></rss>`;
    expect(parseFeed(xml)).toEqual([]);
  });

  it("returns null for a missing or invalid date", () => {
    const xml = `<rss><item><title>T</title><link>https://example.com/t</link><pubDate>nonsense</pubDate></item></rss>`;
    expect(parseFeed(xml)[0].publishedAt).toBeNull();
  });
});

describe("isOffTopic", () => {
  it("flags sport and entertainment headlines", () => {
    expect(isOffTopic("India vs Australia: IPL final preview")).toBe(true);
    expect(isOffTopic("Bollywood star's new film tops box office")).toBe(true);
    expect(isOffTopic("9/30: CBS Evening News")).toBe(true);
  });
  it("keeps geopolitics headlines, including ones with look-alike words", () => {
    expect(isOffTopic("Pakistan rejects commission report on Afghan war")).toBe(false);
    expect(isOffTopic("Golfstrom shift alarms scientists")).toBe(false);
  });
});
