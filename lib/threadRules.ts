// A "thread" ties follow-up stories to the first story about an event. The first
// story is the root; each follow-up stores the root's slug in `thread_slug`.
export type ThreadItem = { slug: string; headline: string; publishedAt: string };

// Which story a follow-up should be filed under. Always the root of the chosen
// story, so threads never chain, and never the story itself.
export function resolveThreadRoot(chosen: { slug: string; thread_slug: string | null }, selfSlug: string): string | null {
  if (chosen.slug === selfSlug) return null;
  const root = chosen.thread_slug ?? chosen.slug;
  return root === selfSlug ? null : root;
}

export function buildTimeline(items: ThreadItem[]): ThreadItem[] {
  return [...items].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
}
