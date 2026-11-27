import { supabaseServer } from "./supabase-server";

export type PostStatus = "draft" | "submitted" | "changes" | "published";
export type Analyst = { email: string; name: string; bio: string; active: boolean };
export type Post = {
  id: string;
  slug: string;
  authorEmail: string;
  authorName: string;
  title: string;
  summary: string;
  body: string;
  heroUrl: string;
  tags: string[];
  status: PostStatus;
  editorNote: string;
  submittedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const STATUS_LABEL: Record<PostStatus, string> = { draft: "Draft", submitted: "With the editor", changes: "Changes requested", published: "Published" };
export const MIN_WORDS_TO_SUBMIT = 150;

// A writer can edit her own piece while it is a draft or the editor has asked for changes.
export const canWriterEdit = (s: PostStatus): boolean => s === "draft" || s === "changes";

export function wordCount(md: string): number {
  return md.trim() ? md.trim().split(/\s+/).length : 0;
}
export const readMinutes = (md: string): number => Math.max(1, Math.round(wordCount(md) / 220));

export function cleanTags(raw: string): string[] {
  const out: string[] = [];
  for (const t of raw.split(",")) {
    const v = t.trim().slice(0, 30);
    if (v && !out.some((x) => x.toLowerCase() === v.toLowerCase())) out.push(v);
    if (out.length >= 6) break;
  }
  return out;
}

export const slugifyPost = (t: string): string => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "write-up";

export type WriterStats = { drafts: number; withEditor: number; changes: number; published: number; words: number };
export function writerStats(posts: Pick<Post, "status" | "body">[]): WriterStats {
  const s: WriterStats = { drafts: 0, withEditor: 0, changes: 0, published: 0, words: 0 };
  for (const p of posts) {
    if (p.status === "draft") s.drafts++;
    else if (p.status === "submitted") s.withEditor++;
    else if (p.status === "changes") s.changes++;
    else if (p.status === "published") s.published++;
    s.words += wordCount(p.body);
  }
  return s;
}

// What blocks a piece from being sent to the editor. Empty when it is ready.
export function submitProblems(p: { title: string; summary: string; body: string }): string[] {
  const out: string[] = [];
  if (!p.title.trim()) out.push("Add a title.");
  if (!p.summary.trim()) out.push("Add a one or two sentence summary.");
  if (wordCount(p.body) < MIN_WORDS_TO_SUBMIT) out.push(`Write at least ${MIN_WORDS_TO_SUBMIT} words (you have ${wordCount(p.body)}).`);
  return out;
}

type Row = {
  id: string;
  slug: string;
  author_email: string;
  title: string;
  summary: string;
  body: string;
  hero_url: string;
  tags: string[] | null;
  status: PostStatus;
  editor_note: string;
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
const COLS = "id, slug, author_email, title, summary, body, hero_url, tags, status, editor_note, submitted_at, published_at, created_at, updated_at";

function toPost(r: Row, names: Map<string, string>): Post {
  return {
    id: r.id,
    slug: r.slug,
    authorEmail: r.author_email,
    authorName: names.get(r.author_email) ?? "Analyst",
    title: r.title,
    summary: r.summary,
    body: r.body,
    heroUrl: r.hero_url,
    tags: r.tags ?? [],
    status: r.status,
    editorNote: r.editor_note,
    submittedAt: r.submitted_at,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listAnalysts(): Promise<Analyst[]> {
  try {
    const { data, error } = await supabaseServer().from("analysts").select("email, name, bio, active").order("created_at");
    return error || !data ? [] : (data as Analyst[]);
  } catch {
    return [];
  }
}

export async function getAnalyst(email: string | null | undefined): Promise<Analyst | null> {
  if (!email) return null;
  try {
    const { data } = await supabaseServer().from("analysts").select("email, name, bio, active").eq("email", email.toLowerCase()).maybeSingle();
    return data ? (data as Analyst) : null;
  } catch {
    return null;
  }
}

async function nameMap(): Promise<Map<string, string>> {
  return new Map((await listAnalysts()).map((a) => [a.email, a.name]));
}

// All posts, optionally narrowed. Empty when the tables do not exist yet.
export async function listPosts(opts: { authorEmail?: string; status?: PostStatus } = {}): Promise<Post[]> {
  try {
    let q = supabaseServer().from("analyst_posts").select(COLS).order("updated_at", { ascending: false }).limit(200);
    if (opts.authorEmail) q = q.eq("author_email", opts.authorEmail.toLowerCase());
    if (opts.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error || !data) return [];
    const names = await nameMap();
    return (data as unknown as Row[]).map((r) => toPost(r, names));
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string, opts: { includeUnpublished?: boolean } = {}): Promise<Post | null> {
  try {
    let q = supabaseServer().from("analyst_posts").select(COLS).eq("slug", slug);
    if (!opts.includeUnpublished) q = q.eq("status", "published");
    const { data, error } = await q.maybeSingle();
    return error || !data ? null : toPost(data as unknown as Row, await nameMap());
  } catch {
    return null;
  }
}

export async function getPostById(id: string): Promise<Post | null> {
  try {
    const { data, error } = await supabaseServer().from("analyst_posts").select(COLS).eq("id", id).maybeSingle();
    return error || !data ? null : toPost(data as unknown as Row, await nameMap());
  } catch {
    return null;
  }
}
