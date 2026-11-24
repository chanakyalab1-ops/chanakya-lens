'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase-user';
import { supabaseServer } from '@/lib/supabase-server';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { getMembership, isActiveMember } from '@/lib/membership';
import { canAddToShelf, cleanNote } from '@/lib/shelf';

export type ShelfResult = { ok: true; saved: boolean } | { ok: false; error: string; limit?: boolean };

export async function toggleShelf(slug: string): Promise<ShelfResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'Sign in to use your Shelf.' };
  if (!membershipVisibleTo(user.email)) return { ok: false, error: 'Not available yet.' };
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return { ok: false, error: 'Unknown story.' };

  const db = supabaseServer();
  const { data, error: readError } = await db.from('shelf_items').select('slug').eq('user_id', user.id);
  if (readError) return { ok: false, error: 'Could not save. Try again.' };
  const rows = (data ?? []) as { slug: string }[];

  if (rows.some((r) => r.slug === slug)) {
    const { error } = await db.from('shelf_items').delete().eq('user_id', user.id).eq('slug', slug);
    if (error) return { ok: false, error: 'Could not save. Try again.' };
    revalidatePath('/account/shelf');
    return { ok: true, saved: false };
  }

  const isMember = isActiveMember(await getMembership(user.id));
  if (!canAddToShelf(rows.length, { isMember, membershipPublic: process.env.MEMBERSHIP_PUBLIC === 'true' })) {
    return { ok: false, error: 'Your Shelf is full.', limit: true };
  }
  const { error } = await db.from('shelf_items').insert({ user_id: user.id, slug });
  if (error) return { ok: false, error: 'Could not save. Try again.' };
  revalidatePath('/account/shelf');
  return { ok: true, saved: true };
}

export async function saveShelfNote(slug: string, note: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user || !membershipVisibleTo(user.email)) return { ok: false };
  const { error } = await supabaseServer().from('shelf_items').update({ note: cleanNote(note) }).eq('user_id', user.id).eq('slug', slug);
  return { ok: !error };
}
