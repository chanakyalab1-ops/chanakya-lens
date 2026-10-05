import { unstable_cache } from "next/cache";
import { supabase } from "./supabase";
import { articleHost, resolveSourceCountry } from "./outletCountries";

export type ConfidenceLevel = "direct" | "likely" | "possible";

export type ImpactNode = {
  confidence: ConfidenceLevel;
  audience: string;
  mechanism: string;
};

export type ArticleRole = "primary" | "local" | "international" | "source";

export type Source = {
  url: string;
  title: string;
  domain: string;
  sourceCountry: string | null;
  role: ArticleRole;
};

export type Story = {
  slug: string;
  category: string;
  status?: "developing" | "settled";
  headline: string;
  dek: string;
  body: string;
  readTime: string;
  hasVideo?: boolean;
  impactNodes?: ImpactNode[]; // empty/null = plain brief
  sources?: Source[];
  chanakyaAnalysis?: string;
  offLens?: string;
  offLensCountries?: Record<string, number>;
  subjectCountries?: string[];
  imageUrl?: string;
  publishedAt: string; // ISO timestamp from stories.created_at
  qualityScore?: number | null;
};

// Supabase rows use snake_case; map to the camelCase Story type used across the UI
type StoryRow = {
  slug: string;
  category: string;
  status: "developing" | "settled" | null;
  headline: string;
  dek: string;
  body: string;
  read_time: string;
  has_video: boolean | null;
  impact_nodes: ImpactNode[] | null;
  sources: { url: string; title: string; domain: string; source_country: string | null; role: ArticleRole }[] | null;
  chanakya_analysis: string | null;
  off_lens: string | null;
  off_lens_countries: Record<string, number> | null;
  subject_countries: string[] | null;
  image_url: string | null;
  created_at: string;
  quality_score: number | null;
};

function mapRow(row: StoryRow): Story {
  return {
    slug: row.slug,
    category: row.category,
    status: row.status ?? undefined,
    headline: row.headline,
    dek: row.dek,
    body: row.body,
    readTime: row.read_time,
    hasVideo: row.has_video ?? false,
    impactNodes: row.impact_nodes && row.impact_nodes.length > 0 ? row.impact_nodes : undefined,
    sources: row.sources && row.sources.length > 0
      ? row.sources.map((s) => ({ url: s.url, title: s.title, domain: articleHost(s.url) || s.domain, sourceCountry: resolveSourceCountry(s.source_country, s.domain, s.url), role: s.role }))
      : undefined,
    chanakyaAnalysis: row.chanakya_analysis ?? undefined,
    offLens: row.off_lens ?? undefined,
    offLensCountries: row.off_lens_countries ?? undefined,
    subjectCountries: row.subject_countries && row.subject_countries.length > 0 ? row.subject_countries : undefined,
    imageUrl: row.image_url ?? undefined,
    publishedAt: row.created_at,
    qualityScore: row.quality_score,
  };
}

// Everything the list views (home, today, lens, regions, sitemap, feed) need,
// without `body` -- the article text is the largest column and only the story
// page reads it (via getStoryBySlug). Pulling it into every list render was a
// major source of database egress.
const LIST_COLUMNS =
  "slug, category, status, headline, dek, read_time, has_video, impact_nodes, sources, chanakya_analysis, off_lens, off_lens_countries, subject_countries, image_url, created_at, quality_score";

async function fetchAllStories(): Promise<Story[]> {
  // Ranked by quality_score (best-fact-checked first), falling back to
  // recency. Stories published before fact-check scores existed carry
  // quality_score=null, which nullsFirst:false sends to the bottom of that
  // tier -- so today, with no real scores populated yet, this sorts
  // identically to created_at DESC, and starts ranking by score the moment
  // scores start landing without needing a separate code path later.
  const { data, error } = await supabase
    .from("stories")
    .select(LIST_COLUMNS)
    .order("quality_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    // Throw, so a failed read is never stored in the cache as "no stories".
    throw new Error(`Failed to fetch stories: ${error.message}`);
  }
  return (data as unknown as Omit<StoryRow, "body">[]).map((row) => mapRow({ ...row, body: "" }));
}

// One shared read for every page and every build, refreshed every 10 minutes
// or when a story is published, edited or unpublished (updateTag("stories")).
// Without this each page regeneration and each prerendered page in a deploy
// re-downloaded the whole table.
const cachedStories = unstable_cache(fetchAllStories, ["all-stories"], { revalidate: 600, tags: ["stories"] });

export async function getAllStories(): Promise<Story[]> {
  try {
    return await cachedStories();
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return [];
  }
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return mapRow(data as StoryRow);
}
