// TheNewsAPI -- replaces NewsCatcher (trial expired).
// Docs: https://www.thenewsapi.com/documentation

import type { GdeltArticle, GdeltFetchResult } from "./gdelt";

const THENEWSAPI_ENDPOINT = "https://api.thenewsapi.com/v1/news/all";

const QUERIES = [
  "tariff",
  "sanctions export controls",
  "border conflict",
  "military exercise defense pact",
  "diplomatic talks negotiations",
  "military buildup troop deployment",
  "energy pipeline supply",
  "trade deal agreement bilateral",
  "maritime dispute territorial waters",
];

// Preferred, not required -- articles from these domains get sorted first
// within each query's results, but we no longer hard-filter to only these.
const TRUSTED_DOMAINS = new Set([
  "reuters.com", "wsj.com", "washingtonpost.com", "apnews.com", "bbc.com",
  "ft.com", "bloomberg.com", "economist.com", "nytimes.com", "cnn.com",
]);

const DOMAIN_TO_COUNTRY: Record<string, string> = {
  // South Asia
  "dawn.com": "Pakistan",
  "thenews.com.pk": "Pakistan",
  "geo.tv": "Pakistan",
  "thehindu.com": "India",
  "hindustantimes.com": "India",
  "ndtv.com": "India",
  "indiatoday.in": "India",
  "economictimes.indiatimes.com": "India",
  "timesofindia.indiatimes.com": "India",
  "thewire.in": "India",
  "theprint.in": "India",
  "scroll.in": "India",
  "thedailystar.net": "Bangladesh",
  "colombotelegraph.com": "Sri Lanka",
  // Middle East
  "aljazeera.com": "Qatar",
  "arabnews.com": "Saudi Arabia",
  "saudigazette.com.sa": "Saudi Arabia",
  "haaretz.com": "Israel",
  "jpost.com": "Israel",
  "timesofisrael.com": "Israel",
  "ynetnews.com": "Israel",
  "presstv.ir": "Iran",
  "irna.ir": "Iran",
  "tehrantimes.com": "Tehran",
  "middleeasteye.net": "United Kingdom",
  "alarabiya.net": "Saudi Arabia",
  "thenationalnews.com": "UAE",
  "gulfnews.com": "UAE",
  "khaleejtimes.com": "UAE",
  "jordantimes.com": "Jordan",
  "dailysabah.com": "Turkey",
  "hurriyetdailynews.com": "Turkey",
  "yenisafak.com": "Turkey",
  // East Asia
  "globaltimes.cn": "China",
  "xinhuanet.com": "China",
  "chinadaily.com.cn": "China",
  "scmp.com": "Hong Kong",
  "koreaherald.com": "South Korea",
  "koreatimes.co.kr": "South Korea",
  "japantimes.co.jp": "Japan",
  "nhk.or.jp": "Japan",
  "taipeitimes.com": "Taiwan",
  "focustaiwan.tw": "Taiwan",
  "vietnamnews.vn": "Vietnam",
  "bangkokpost.com": "Thailand",
  "straitstimes.com": "Singapore",
  "channelnewsasia.com": "Singapore",
  "philstar.com": "Philippines",
  "inquirer.net": "Philippines",
  // Russia/Eastern Europe
  "rt.com": "Russia",
  "tass.com": "Russia",
  "interfax.com": "Russia",
  "kommersant.ru": "Russia",
  "kyivindependent.com": "Ukraine",
  "pravda.com.ua": "Ukraine",
  "unian.info": "Ukraine",
  // Africa
  "dailymaverick.co.za": "South Africa",
  "timeslive.co.za": "South Africa",
  "nation.africa": "Kenya",
  "thisdaylive.com": "Nigeria",
  "punchng.com": "Nigeria",
  "egyptindependent.com": "Egypt",
  "ahram.org.eg": "Egypt",
  "moroccoworldnews.com": "Morocco",
  // Europe (regional only, not wire services)
  "dw.com": "Germany",
  "thelocal.de": "Germany",
  "lefigaro.fr": "France",
  "lemonde.fr": "France",
  "elpais.com": "Spain",
  "corriere.it": "Italy",
  "rferl.org": "United States",
  // Latin America
  "buenosairesherald.com": "Argentina",
  "mercopress.com": "Uruguay",
  "brasilwire.com": "Brazil",
};

function inferCountryFromDomain(domain: string): string {
  const cleaned = domain.replace(/^www\./, "");
  return DOMAIN_TO_COUNTRY[cleaned] ?? "";
}

const REQUEST_TIMEOUT_MS = 15000;
const DELAY_BETWEEN_REQUESTS_MS = 1500;
const ARTICLES_PER_PAGE = 3; // free tier hard cap, confirmed
const PAGES_PER_QUERY = 4; // 4 topics x 4 pages x 3 = ~48 articles per run

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type TheNewsApiArticle = {
  title?: string;
  url?: string;
  source?: string;
  language?: string;
  published_at?: string;
};

async function fetchOnePage(query: string, page: number): Promise<GdeltArticle[]> {
  const apiKey = process.env.THENEWSAPI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing THENEWSAPI_API_KEY env var.");
  }

  const publishedAfter = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const params = new URLSearchParams({
    api_token: apiKey,
    search: query,
    language: "en",
    published_after: publishedAfter,
    limit: String(ARTICLES_PER_PAGE),
    page: String(page),
    sort: "published_at",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${THENEWSAPI_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TheNewsAPI HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const articles: TheNewsApiArticle[] = data?.data ?? [];

    console.log(`[TheNewsAPI] "${query}" page ${page} -- ${articles.length} articles (found: ${data?.meta?.found ?? "?"})`);

    const results: GdeltArticle[] = [];
    for (const a of articles) {
      if (!a.url || !a.title) continue;
      results.push({
        url: a.url,
        title: a.title,
        domain: a.source ?? "",
        sourcecountry: inferCountryFromDomain(a.source ?? ""),
        seendate: a.published_at ?? "",
        tone: 0,
      });
    }

    // Sort trusted-source articles first within this page's results,
    // without excluding everything else.
    results.sort((a, b) => {
      const aTrusted = TRUSTED_DOMAINS.has(a.domain) ? 0 : 1;
      const bTrusted = TRUSTED_DOMAINS.has(b.domain) ? 0 : 1;
      return aTrusted - bTrusted;
    });

    return results;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function fetchTheNewsApiCandidates(): Promise<GdeltFetchResult> {
  console.log(`[TheNewsAPI] START ${new Date().toISOString()}`);

  const articles: Array<GdeltArticle & { queryTag: string }> = [];
  let queriesSucceeded = 0;
  let queriesFailed = 0;
  const failureDetails: string[] = [];

  for (const query of QUERIES) {
    let queryHadSuccess = false;

    for (let page = 1; page <= PAGES_PER_QUERY; page++) {
      try {
        const results = await fetchOnePage(query, page);
        queryHadSuccess = true;
        for (const a of results) {
          articles.push({ ...a, queryTag: query });
        }
        if (results.length === 0) break;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failureDetails.push(`"${query}" page ${page}: ${message}`);
        console.error(`[TheNewsAPI] Failed "${query}" page ${page}: ${message}`);
      }

      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }

    if (queryHadSuccess) {
      queriesSucceeded++;
    } else {
      queriesFailed++;
    }
  }

  console.log(`[TheNewsAPI] END -- succeeded: ${queriesSucceeded}, failed: ${queriesFailed}, articles: ${articles.length}`);

  return {
    articles,
    queriesAttempted: QUERIES.length,
    queriesSucceeded,
    queriesFailed,
    failureDetails,
  };
}

