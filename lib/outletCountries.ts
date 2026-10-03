import { RSS_FEEDS } from "./rssFeeds";
import { inferCountryFromDomain } from "./thenewsapi";

// Wire services and big outlets that are not in the RSS feed list.
const EXTRA: Record<string, string> = {
  "reuters.com": "United Kingdom",
  "apnews.com": "United States",
  "bloomberg.com": "United States",
  "wsj.com": "United States",
  "afp.com": "France",
  "axios.com": "United States",
  "foreignaffairs.com": "United States",
  "aljazeera.com": "Qatar",
  "time.com": "United States",
  "energyintel.com": "United States",
  "wionews.com": "India",
  "outlookindia.com": "India",
  "nationalheraldindia.com": "India",
  "newsbytesapp.com": "India",
  "kashmirobserver.net": "India",
  "telesurenglish.net": "Venezuela",
  "slguardian.org": "Sri Lanka",
  "worldisraelnews.com": "Israel",
  "wanaen.com": "Iran",
  "mbiz.heraldcorp.com": "South Korea",
  "heraldcorp.com": "South Korea",
  "news.sbs.co.kr": "South Korea",
  "hrw.org": "United States",
};

const FEED_COUNTRY = new Map(RSS_FEEDS.map((f) => [f.domain, f.country]));

// Country-code TLDs only -- a .com says nothing about where an outlet is.
// .co is left out on purpose: sites use it as a generic "company" domain far
// more often than as Colombia's.
const TLD: Record<string, string> = {
  pk: "Pakistan", in: "India", uk: "United Kingdom", au: "Australia", ca: "Canada",
  za: "South Africa", ng: "Nigeria", ke: "Kenya", jp: "Japan", kr: "South Korea",
  cn: "China", ru: "Russia", ua: "Ukraine", il: "Israel", ir: "Iran", tr: "Turkey",
  sa: "Saudi Arabia", ae: "United Arab Emirates", qa: "Qatar", eg: "Egypt", de: "Germany",
  fr: "France", it: "Italy", es: "Spain", br: "Brazil", mx: "Mexico", ar: "Argentina",
  id: "Indonesia", my: "Malaysia", sg: "Singapore", ph: "Philippines", th: "Thailand",
  vn: "Vietnam", bd: "Bangladesh", lk: "Sri Lanka", np: "Nepal", nz: "New Zealand",
  ie: "Ireland", pl: "Poland", ch: "Switzerland", be: "Belgium", nl: "Netherlands",
  se: "Sweden", no: "Norway", gr: "Greece", ma: "Morocco", tz: "Tanzania", ug: "Uganda",
  gh: "Ghana", et: "Ethiopia", pe: "Peru", cl: "Chile", ve: "Venezuela",
  tw: "Taiwan", hk: "Hong Kong", af: "Afghanistan", jo: "Jordan", lb: "Lebanon", kz: "Kazakhstan",
};

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

// Best-effort home country of an outlet; "" when unknown.
export function countryForDomain(input: string): string {
  const domain = normalizeDomain(input);
  if (!domain) return "";
  const known = FEED_COUNTRY.get(domain) ?? EXTRA[domain] ?? inferCountryFromDomain(domain);
  if (known) return known;
  const tld = domain.split(".").pop() ?? "";
  return TLD[tld] ?? "";
}

// The country stored on a source, or the outlet's home country when none was
// recorded (stories generated from RSS and Google News carry no country).
export function resolveSourceCountry(stored: string | null | undefined, domain: string, url?: string): string | null {
  const s = (stored ?? "").trim();
  if (s && s.toLowerCase() !== "unknown") return s;
  const host = articleHost(url);
  return (host && countryForDomain(host)) || countryForDomain(domain) || null;
}

// The outlet that published an article, taken from its URL. RSS candidates
// store the feed's host instead (feeds.thelocal.com), which says nothing about
// the outlet; Google News links point at the aggregator, so they don't count.
export function articleHost(url?: string): string {
  if (!url) return "";
  try {
    const host = normalizeDomain(new URL(url).hostname);
    return isAggregator(host) ? "" : host;
  } catch {
    return "";
  }
}

const ALIASES: Record<string, string> = {
  "bbc.co.uk": "bbc.com",
  "theguardian.co.uk": "theguardian.com",
};

// Aggregators and syndication sites republish other outlets' articles, so
// they are not independent sources.
const AGGREGATORS = [
  "yahoo.com", "aol.com", "msn.com", "audacy.com", "newsbreak.com", "flipboard.com",
  "dailyhunt.in", "smartnews.com", "ground.news", "allsides.com", "apple.news",
  "news.google.com", "pressreader.com", "newsnow.co.uk",
];

// One name per outlet: drops mobile/AMP/edition subdomains and merges known
// domain pairs, so "amp.dw.com" and "dw.com" count once.
export function canonicalDomain(input: string): string {
  let d = normalizeDomain(input).replace(/^(amp|m|mobile|edition|us|uk)\./, "");
  d = ALIASES[d] ?? d;
  return d;
}

export function isAggregator(input: string): boolean {
  const d = canonicalDomain(input);
  return AGGREGATORS.some((a) => d === a || d.endsWith(`.${a}`));
}
