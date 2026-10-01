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

export function isOffTopic(title: string): boolean {
  return OFF_TOPIC_RE.test(title);
}

export function isExcluded(title: string): boolean {
  const lower = title.toLowerCase();
  return EXCLUDED_KEYWORDS.some((kw) => lower.includes(kw));
}
