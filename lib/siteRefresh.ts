import { revalidatePath, revalidateTag } from "next/cache";

// Pages rebuild on a long timer (12 hours) to keep database reads and ISR
// writes down, so anything that changes the stories has to refresh the pages
// it affects right away. These are the pages that list or link stories.
export const LISTING_PATHS = ["/", "/today", "/regions", "/off-lens", "/rss.xml", "/news-sitemap.xml", "/sitemap.xml"];

export function refreshListingPages(): void {
  for (const path of LISTING_PATHS) revalidatePath(path);
}

export function refreshStoryPage(slug: string): void {
  revalidatePath(`/story/${slug}`);
}

// For API routes and cron jobs (server actions use updateTag instead): marks
// the shared story list stale and the affected pages for rebuild on next visit.
export function refreshAfterStoryUpdates(slugs: string[]): void {
  if (slugs.length === 0) return;
  revalidateTag("stories", "max");
  refreshListingPages();
  for (const slug of new Set(slugs)) refreshStoryPage(slug);
}
