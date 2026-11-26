import { supabaseServer } from "./supabase-server";
import { paidAccess, type Access } from "./entitlements";

export type Dispatch = { slug: string; title: string; summary: string; body: string; heroUrl: string; theme: string; published: boolean; publishedAt: string | null; period: string | null };

type Row = { slug: string; title: string; summary: string; body: string; hero_url: string; theme: string; published: boolean; published_at: string | null; period?: string | null };
const toDispatch = (r: Row): Dispatch => ({ slug: r.slug, title: r.title, summary: r.summary, body: r.body, heroUrl: r.hero_url, theme: r.theme, published: r.published, publishedAt: r.published_at, period: r.period ?? null });
const COLS = "slug, title, summary, body, hero_url, theme, published, published_at, period";
// Before the `period` column is added, fall back to the older column list.
const OLD_COLS = "slug, title, summary, body, hero_url, theme, published, published_at";

export const slugifyDispatch = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// Dispatches are a Lens+ perk. Hidden until membership is public (owner always sees
// them); after that a free reader or a visitor sees a preview, a member sees all.
export async function dispatchAccess(user: { id: string; email?: string | null } | null): Promise<Access> {
  if (user) return paidAccess(user);
  return process.env.MEMBERSHIP_PUBLIC === "true" ? "locked" : "hidden";
}

// Empty when the table does not exist yet.
export async function listDispatches(opts: { includeDrafts?: boolean } = {}): Promise<Dispatch[]> {
  try {
    const run = (cols: string) => {
      let q = supabaseServer().from("dispatches").select(cols).order("published_at", { ascending: false, nullsFirst: true }).limit(100);
      if (!opts.includeDrafts) q = q.eq("published", true);
      return q;
    };
    let { data, error } = await run(COLS);
    if (error) ({ data, error } = await run(OLD_COLS));
    return error || !data ? [] : (data as unknown as Row[]).map(toDispatch);
  } catch {
    return [];
  }
}

export async function getDispatch(slug: string, opts: { includeDrafts?: boolean } = {}): Promise<Dispatch | null> {
  try {
    const run = (cols: string) => {
      let q = supabaseServer().from("dispatches").select(cols).eq("slug", slug);
      if (!opts.includeDrafts) q = q.eq("published", true);
      return q.maybeSingle();
    };
    let { data, error } = await run(COLS);
    if (error) ({ data, error } = await run(OLD_COLS));
    return error || !data ? null : toDispatch(data as unknown as Row);
  } catch {
    return null;
  }
}
