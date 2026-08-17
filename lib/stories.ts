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
  };
}

export async function getAllStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
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