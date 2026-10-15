export type DigestStory = {
  slug: string;
  headline: string;
  dek: string;
  category: string;
  status: string | null;
  impact_nodes: { confidence: string }[] | null;
};

function rank(s: DigestStory): number {
  const hasDirect = s.impact_nodes?.some((n) => n.confidence === "direct");
  const isDeveloping = s.status === "developing";
  let score = 0;
  if (isDeveloping) score += 2;
  if (hasDirect) score += 1;
  return score;
}

export function pickDigestStories(stories: DigestStory[], limit: number): DigestStory[] {
  return [...stories].sort((a, b) => rank(b) - rank(a)).slice(0, limit);
}

export type SubscriberDigest = {
  stories: DigestStory[];
  topicLabel: string;
  // True when none of today's stories matched the subscriber's chosen topics,
  // so they get the day's top stories instead of nothing.
  fellBack: boolean;
};

// Everyone with at least one story available gets a digest every day:
// the stories in their topics if there are any, otherwise the top stories.
export function selectDigestForSubscriber(stories: DigestStory[], topics: string[] | null | undefined, limit = 6): SubscriberDigest | null {
  if (stories.length === 0) return null;
  const chosen = topics ?? [];
  if (chosen.length === 0) return { stories: pickDigestStories(stories, limit), topicLabel: "All Topics", fellBack: false };
  const matching = stories.filter((s) => chosen.includes(s.category));
  if (matching.length > 0) return { stories: pickDigestStories(matching, limit), topicLabel: chosen.join(", "), fellBack: false };
  return { stories: pickDigestStories(stories, limit), topicLabel: "Top Stories", fellBack: true };
}
