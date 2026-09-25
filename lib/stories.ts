import { supabase } from "./supabase";

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
      ? row.sources.map((s) => ({ url: s.url, title: s.title, domain: s.domain, sourceCountry: s.source_country, role: s.role }))
      : undefined,
    chanakyaAnalysis: row.chanakya_analysis ?? undefined,
    offLens: row.off_lens ?? undefined,
    subjectCountries: row.subject_countries && row.subject_countries.length > 0 ? row.subject_countries : undefined,
    imageUrl: row.image_url ?? undefined,
    publishedAt: row.created_at,
    qualityScore: row.quality_score,
  };
}

export async function getAllStories(): Promise<Story[]> {
  // Ranked by quality_score (best-fact-checked first), falling back to
  // recency. Stories published before fact-check scores existed carry
  // quality_score=null, which nullsFirst:false sends to the bottom of that
  // tier -- so today, with no real scores populated yet, this sorts
  // identically to created_at DESC, and starts ranking by score the moment
  // scores start landing without needing a separate code path later.
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("quality_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to fetch stories:", error.message);
    return [];
  }
  return (data as StoryRow[]).map(mapRow);
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
