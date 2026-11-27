'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase-user';
import { isOwnerEmail } from '@/lib/memberAccess';
import { supabaseServer } from '@/lib/supabase-server';
import { needsFollowup, validEmail, type OutreachVersion } from '@/lib/outreachEmail';

type Result = { ok: boolean; error?: string };

async function owner(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && isOwnerEmail(user.email);
}

const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

export async function addCreator(input: { name: string; email: string; channelUrl: string; videoTitle: string; topic: string; specific: string; version: OutreachVersion }): Promise<Result> {
  if (!(await owner())) return { ok: false, error: 'Not allowed.' };
  const email = clip(input.email, 200).toLowerCase();
  const name = clip(input.name, 100);
  if (!name) return { ok: false, error: 'Add their name.' };
  if (!validEmail(email)) return { ok: false, error: 'That email does not look right.' };
  const { error } = await supabaseServer().from('creator_outreach').insert({
    name,
    email,
    channel_url: clip(input.channelUrl, 300),
    video_title: clip(input.videoTitle, 200),
    topic: clip(input.topic, 120),
    specific: clip(input.specific, 300),
    version: input.version === 'econ' ? 'econ' : 'geo',
  });
  if (error) return { ok: false, error: error.code === '23505' ? 'You already have this email on the list.' : 'Could not save. Has supabase/creator-outreach.sql been run?' };
  revalidatePath('/admin/creator-outreach');
  return { ok: true };
}

// Records that you sent the first email (draft -> sent) or the follow-up. Never for someone who said no.
export async function markSent(id: string, kind: 'first' | 'followup'): Promise<Result> {
  if (!(await owner())) return { ok: false, error: 'Not allowed.' };
  const db = supabaseServer();
  const { data } = await db.from('creator_outreach').select('status, sent_at, followup_sent_at').eq('id', id).maybeSingle();
  const row = data as { status: string; sent_at: string | null; followup_sent_at: string | null } | null;
  if (!row) return { ok: false, error: 'Not found.' };
  const now = new Date().toISOString();
  if (kind === 'first') {
    if (row.status !== 'draft') return { ok: false, error: 'Already sent, or they have replied.' };
    const { error } = await db.from('creator_outreach').update({ status: 'sent', sent_at: now }).eq('id', id);
    if (error) return { ok: false, error: 'Could not save.' };
  } else {
    if (!needsFollowup(row)) return { ok: false, error: 'No follow-up is due.' };
    const { error } = await db.from('creator_outreach').update({ followup_sent_at: now }).eq('id', id);
    if (error) return { ok: false, error: 'Could not save.' };
  }
  revalidatePath('/admin/creator-outreach');
  return { ok: true };
}

export async function setOutreachStatus(id: string, status: 'replied' | 'yes' | 'no'): Promise<Result> {
  if (!(await owner())) return { ok: false, error: 'Not allowed.' };
  const { error } = await supabaseServer().from('creator_outreach').update({ status }).eq('id', id);
  if (error) return { ok: false, error: 'Could not save.' };
  revalidatePath('/admin/creator-outreach');
  return { ok: true };
}

// "No thanks" rows stay on the list so you never write to them again.
export async function removeDraft(id: string): Promise<Result> {
  if (!(await owner())) return { ok: false, error: 'Not allowed.' };
  const { error } = await supabaseServer().from('creator_outreach').delete().eq('id', id).eq('status', 'draft');
  if (error) return { ok: false, error: 'Could not remove.' };
  revalidatePath('/admin/creator-outreach');
  return { ok: true };
}
