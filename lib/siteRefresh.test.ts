import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a), revalidateTag: (...a: unknown[]) => revalidateTag(...a) }));

import { LISTING_PATHS, refreshAfterStoryUpdates, refreshListingPages, refreshStoryPage } from "./siteRefresh";

beforeEach(() => {
  revalidatePath.mockClear();
  revalidateTag.mockClear();
});

describe("siteRefresh", () => {
  it("refreshes every page that lists stories", () => {
    refreshListingPages();
    expect(revalidatePath.mock.calls.map((c) => c[0])).toEqual(LISTING_PATHS);
    expect(LISTING_PATHS).toEqual(expect.arrayContaining(["/", "/today", "/regions", "/off-lens", "/rss.xml", "/news-sitemap.xml", "/sitemap.xml"]));
  });

  it("refreshes one story page by slug", () => {
    refreshStoryPage("some-story");
    expect(revalidatePath).toHaveBeenCalledWith("/story/some-story");
  });

  it("after updates: marks the story list stale, refreshes listings, and each story once", () => {
    refreshAfterStoryUpdates(["a", "b", "a"]);
    expect(revalidateTag).toHaveBeenCalledWith("stories", "max");
    const paths = revalidatePath.mock.calls.map((c) => c[0]);
    expect(paths).toEqual(expect.arrayContaining(["/story/a", "/story/b", "/"]));
    expect(paths.filter((p) => p === "/story/a")).toHaveLength(1);
  });

  it("does nothing when nothing was updated", () => {
    refreshAfterStoryUpdates([]);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
