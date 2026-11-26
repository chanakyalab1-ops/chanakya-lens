'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase-user';
import { isOwnerEmail } from '@/lib/memberAccess';
import { supabaseServer } from '@/lib/supabase-server';
import { slugifyDispatch } from '@/lib/monthly';
import { generateMonthlyDraft, type DraftResult } from '@/lib/monthlyDraft';
import { currentPeriod, isValidPeriod } from '@/lib/monthlyStats';

export type SaveResult = { ok: true; slug: string } | { ok: false; error: string };

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

async function requireOwner() {
  const user = await getSessionUser();
  return user && isOwnerEmail(user.email) ? user : null;
}

export async function saveDispatch(input: { slug?: string; title: string; theme: string; summary: string; heroUrl: string; body: string; published: boolean; period?: string }): Promise<SaveResult> {
  if (!(await requireOwner())) return { ok: false, error: 'Not allowed.' };
  const title = clip(input.title, 160);
  const slug = input.slug && /^[a-z0-9-]{1,80}$/.test(input.slug) ? input.slug : slugifyDispatch(title);
  if (!title || !slug) return { ok: false, error: 'Give it a title.' };
  const heroUrl = clip(input.heroUrl, 500);
  if (heroUrl && !/^https:\/\//.test(heroUrl)) return { ok: false, error: 'The hero image link must start with https://' };

  const db = supabaseServer();
  const { data: existing } = await db.from('dispatches').select('published, published_at').eq('slug', slug).maybeSingle();
  const row = (existing ?? null) as { published: boolean; published_at: string | null } | null;
  const publishedAt = input.published ? row?.published_at ?? new Date().toISOString() : row?.published_at ?? null;
  const { error } = await db.from('dispatches').upsert({
    slug, title, theme: clip(input.theme, 60), summary: clip(input.summary, 400), hero_url: heroUrl,
    body: typeof input.body === 'string' ? input.body.slice(0, 60000) : '', ...(isValidPeriod(input.period) ? { period: input.period } : {}), published: !!input.published, published_at: publishedAt, updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: 'Could not save. Has the SQL been run?' };
  revalidatePath('/monthly');
  revalidatePath(`/monthly/${slug}`);
  revalidatePath('/admin/monthly');
  return { ok: true, slug };
}

export async function deleteDispatch(slug: string): Promise<{ ok: boolean }> {
  if (!(await requireOwner()) || !/^[a-z0-9-]{1,80}$/.test(slug)) return { ok: false };
  const { error } = await supabaseServer().from('dispatches').delete().eq('slug', slug);
  revalidatePath('/monthly');
  revalidatePath('/admin/monthly');
  return { ok: !error };
}

// Makes (or finds) the draft for a month right now, instead of waiting for the 27th.
export async function generateDraftNow(period?: string): Promise<DraftResult> {
  if (!(await requireOwner())) return { ok: false, error: 'Not allowed.' };
  const result = await generateMonthlyDraft(period && isValidPeriod(period) ? period : currentPeriod());
  revalidatePath('/admin/monthly');
  return result;
}
