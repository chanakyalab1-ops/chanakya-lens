import { isSportsPower } from "./ingestFilters";

export const GUESS_CATEGORIES = ["Security & Conflict", "Trade & Tariffs", "Political", "Tech & Regulation", "Resources", "Sports & Power"] as const;
export type GuessCategory = (typeof GUESS_CATEGORIES)[number] | "Other";

const RULES: [GuessCategory, RegExp][] = [
  ["Security & Conflict", /\b(war|strike[sd]?|missile|drone|troops?|military|army|navy|ceasefire|attack|killed|invasion|nuclear|defen[cs]e|terror|bomb|conflict|hostage|border clash)\b/i],
  ["Trade & Tariffs", /\b(tariffs?|trade|export[s]?|import[s]?|sanctions?|customs|duty|duties|supply chain|shipping|port|wto|free trade|deal)\b/i],
  ["Tech & Regulation", /\b(ai|chips?|semiconductors?|tech|regulat\w*|antitrust|data|cyber\w*|privacy|crypto|social media|bill|law|ban on)\b/i],
  ["Resources", /\b(oil|gas|lng|crude|opec|energy|coal|lithium|copper|gold|wheat|grain|food prices?|water|fuel|power grid|rare earths?|minerals?)\b/i],
  ["Political", /\b(election|vote|parliament|president|prime minister|minister|cabinet|coalition|protest|government|opposition|court|summit|talks|diplomat\w*)\b/i],
];

// A free, rough guess of the category a proposed story will land in, from its
// headline alone. The real category is chosen when the story is written.
export function guessCategory(headline: string): GuessCategory {
  if (isSportsPower(headline)) return "Sports & Power";
  for (const [cat, re] of RULES) if (re.test(headline)) return cat;
  return "Other";
}
