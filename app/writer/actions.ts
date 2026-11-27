'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase-user';
import { isOwnerEmail } from '@/lib/memberAccess';
import { supabaseServer } from '@/lib/supabase-server';
import { sendAlert } from '@/lib/alerts';
import { canWriterEdit, cleanTags, getAnalyst, getPostById, slugifyPost, submitProblems, type PostStatus } from '@/lib/analystDesk';

type Result = { ok: boolean; error?: string; id?: string };

const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

async function actor() {
  const user = await getSessionUser();
  if (!user?.email) return null;
  const owner = isOwnerEmail(user.email);
  const analyst = await getAnalyst(user.email);
  if (!owner && !(analyst && analyst.active)) return null;
  return { email: user.email.toLowerCase(), owner };
}

export async function savePost(input: { id?: string; title: string; summary: string; body: string; heroUrl: string; tags: string; submit: boolean }): Promise<Result> {
  const who = await actor();
  if (!who) return { ok: false, error: 'Not allowed.' };

  const fields = {
    title: clip(input.title, 150),
    summary: clip(input.summary, 400),
    body: typeof input.body === 'string' ? input.body.trim().slice(0, 60000) : '',
    hero_url: clip(input.heroUrl, 500),
    tags: cleanTags(typeof input.tags === 'string' ? input.tags : ''),
  };
  if (fields.hero_url && !/^https:\/\/\S+$/i.test(fields.hero_url)) return { ok: false, error: 'The image link must start with https://' };
  if (input.submit) {
    const problems = submitProblems(fields);
    if (problems.length) return { ok: false, error: problems.join(' ') };
  }

  const db = supabaseServer();
  const now = new Date().toISOString();

  if (input.id) {
    const existing = await getPostById(input.id);
    if (!existing) return { ok: false, error: 'Not found.' };
    if (!who.owner) {
      if (existing.authorEmail !== who.email) return { ok: false, error: 'Not allowed.' };
      if (!canWriterEdit(existing.status)) return { ok: false, error: 'This piece is with the editor, so it cannot be edited now.' };
    }
    let status: PostStatus = existing.status;
    const extra: Record<string, unknown> = {};
    if (input.submit && !who.owner) {
      status = 'submitted';
      extra.submitted_at = now;
    }
    const { error } = await db.from('analyst_posts').update({ ...fields, status, ...extra, updated_at: now }).eq('id', input.id);
    if (error) return { ok: false, error: 'Could not save.' };
    if (input.submit && !who.owner) await sendAlert('analyst-desk', `"${fields.title}" was sent for review. Open /admin/analyst-desk.`);
    revalidatePath('/writer');
    revalidatePath('/admin/analyst-desk');
    return { ok: true, id: input.id };
  }

  // New piece: a unique address from the title.
  const base = slugifyPost(fields.title || 'write-up');
  for (let n = 0; n < 5; n++) {
    const slug = n === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await db
      .from('analyst_posts')
      .insert({ ...fields, slug, author_email: who.email, status: input.submit && !who.owner ? 'submitted' : 'draft', submitted_at: input.submit && !who.owner ? now : null })
      .select('id')
      .single();
    if (!error && data) {
      if (input.submit && !who.owner) await sendAlert('analyst-desk', `"${fields.title}" was sent for review. Open /admin/analyst-desk.`);
      revalidatePath('/writer');
      revalidatePath('/admin/analyst-desk');
      return { ok: true, id: (data as { id: string }).id };
    }
    if (error && error.code !== '23505') return { ok: false, error: 'Could not save. Has supabase/analyst-desk.sql been run?' };
  }
  return { ok: false, error: 'Could not make a unique address. Change the title a little.' };
}

export async function deleteMyDraft(id: string): Promise<Result> {
  const who = await actor();
  if (!who) return { ok: false, error: 'Not allowed.' };
  const post = await getPostById(id);
  if (!post || post.status !== 'draft' || (!who.owner && post.authorEmail !== who.email)) return { ok: false, error: 'Only your own drafts can be deleted.' };
  const { error } = await supabaseServer().from('analyst_posts').delete().eq('id', id);
  if (error) return { ok: false, error: 'Could not delete.' };
  revalidatePath('/writer');
  return { ok: true };
}
