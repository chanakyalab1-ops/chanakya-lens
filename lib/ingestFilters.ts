// Headlines we never want as story candidates, whatever the ingest source.
export const EXCLUDED_KEYWORDS = [
  "immigration and customs enforcement",
  "supreme court nomination",
  "election campaign rally",
];

// General-news RSS feeds carry sport, entertainment and lifestyle alongside
// world news. Those cluster well (lots of outlets, same match or film) and
// would crowd out real stories once clusters are ranked by outlet count.
const OFF_TOPIC = [
  "cricket", "ipl", "t20", "nba", "nfl", "mlb", "nhl", "premier league",
  "champions league", "la liga", "serie a", "bundesliga", "wimbledon",
  "tennis", "golf", "formula 1", "grand prix", "box office", "bollywood",
  "hollywood", "celebrity", "oscars", "grammy", "horoscope", "recipe",
  "fashion week", "transfer window", "match report", "live score",
  "evening news", "podcast", "newsletter", "crossword", "quiz",
];
const OFF_TOPIC_RE = new RegExp(`\\b(?:${OFF_TOPIC.join("|")})\\b`, "i");

// A sports headline is a story for us only when sport meets power: sanctions,
// boycotts, hosting rights, state money, diplomacy. Both halves must be present,
// so match reports and transfers stay out.
const SPORT_TERMS = [
  "olympic", "olympics", "paralympic", "paralympics", "fifa", "uefa", "ioc", "wada", "icc",
  "world cup", "asian games", "commonwealth games", "asia cup", "premier league",
  "champions league", "formula 1", "grand prix", "cricket", "football", "tennis",
];
const POWER_TERMS = [
  "sanction", "sanctions", "sanctioned", "boycott", "boycotts", "boycotted",
  "geopolitics", "geopolitical", "diplomacy", "diplomatic", "diplomats", "minister", "ministry",
  "government", "sovereign wealth", "pif", "state-owned", "state-backed", "human rights",
  "visa", "visas", "embassy", "hosting rights", "bid to host", "awarded hosting", "ban", "bans", "banned",
];
const termRe = (terms: string[]) => new RegExp(`(?:^|[^a-z0-9])(?:${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?:$|[^a-z0-9])`, "i");
const SPORT_RE = termRe(SPORT_TERMS);
const POWER_RE = termRe(POWER_TERMS);

export function isSportsPower(title: string): boolean {
  return SPORT_RE.test(title) && POWER_RE.test(title);
}

export function isOffTopic(title: string): boolean {
  if (isSportsPower(title)) return false;
  return OFF_TOPIC_RE.test(title);
}

export function isExcluded(title: string): boolean {
  const lower = title.toLowerCase();
  return EXCLUDED_KEYWORDS.some((kw) => lower.includes(kw));
}
