'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase-user';
import { isOwnerEmail } from '@/lib/memberAccess';
import { supabaseServer } from '@/lib/supabase-server';
import { validEmail } from '@/lib/outreachEmail';

type Result = { ok: boolean; error?: string };

async function owner(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && isOwnerEmail(user.email);
}
const refresh = (slug?: string) => {
  revalidatePath('/admin/analyst-desk');
  revalidatePath('/writer');
  revalidatePath('/analyst-desk');
  if (slug) revalidatePath(`/analyst-desk/${slug}`);
};

export async function addAnalyst(input: { email: string; name: string; bio: string }): Promise<Result> {
  if (!(await owner())) return { ok: false, error: 'Not allowed.' };
  const email = input.email.trim().toLowerCase().slice(0, 200);
  const name = input.name.trim().slice(0, 100);
  if (!validEmail(email)) return { ok: false, error: 'That email does not look right.' };
  if (!name) return { ok: false, error: 'Add her name.' };
  const { error } = await supabaseServer().from('analysts').upsert({ email, name, bio: input.bio.trim().slice(0, 400), active: true });
  if (error) return { ok: false, error: 'Could not save. Has supabase/analyst-desk.sql been run?' };
  refresh();
  return { ok: true };
}

export async function setAnalystActive(email: string, active: boolean): Promise<Result> {
  if (!(await owner())) return { ok: false, error: 'Not allowed.' };
  const { error } = await supabaseServer().from('analysts').update({ active }).eq('email', email);
  if (error) return { ok: false, error: 'Could not save.' };
  refresh();
  return { ok: true };
}

export async function publishPost(id: string): Promise<Result> {
  if (!(await owner())) return { ok: false, error: 'Not allowed.' };
  const { data, error } = await supabaseServer().from('analyst_posts').update({ status: 'published', published_at: new Date().toISOString(), editor_note: '' }).eq('id', id).select('slug, story_slug').single();
  if (error) return { ok: false, error: 'Could not publish.' };
  const row = data as { slug: string; story_slug?: string } | null;
  refresh(row?.slug);
  if (row?.story_slug) revalidatePath(`/story/${row.story_slug}`);
  return { ok: true };
}

export async function requestChanges(id: string, note: string): Promise<Result> {
  if (!(await owner())) return { ok: false, error: 'Not allowed.' };
  const text = note.trim().slice(0, 1000);
  if (!text) return { ok: false, error: 'Tell her what to change.' };
  // Asking for changes takes a live piece down until the writer fixes it and publishes again.
  const { data, error } = await supabaseServer().from('analyst_posts').update({ status: 'changes', editor_note: text, published_at: null }).eq('id', id).select('slug, story_slug').single();
  if (error) return { ok: false, error: 'Could not save.' };
  const row = data as { slug: string; story_slug?: string } | null;
  refresh(row?.slug);
  if (row?.story_slug) revalidatePath(`/story/${row.story_slug}`);
  return { ok: true };
}

export async function unpublishPost(id: string): Promise<Result> {
  if (!(await owner())) return { ok: false, error: 'Not allowed.' };
  const { data, error } = await supabaseServer().from('analyst_posts').update({ status: 'draft', published_at: null }).eq('id', id).select('slug, story_slug').single();
  if (error) return { ok: false, error: 'Could not save.' };
  const row = data as { slug: string; story_slug?: string } | null;
  refresh(row?.slug);
  if (row?.story_slug) revalidatePath(`/story/${row.story_slug}`);
  return { ok: true };
}
