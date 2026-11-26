'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase-user';
import { supabaseServer } from '@/lib/supabase-server';
import { membershipVisibleTo } from '@/lib/memberAccess';

export type SavedResult = { ok: true; saved: boolean } | { ok: false; error: string };

// Saves or un-saves a story for the signed-in reader (stored in shelf_items).
export async function toggleSaved(slug: string): Promise<SavedResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'Sign in to save stories.' };
  if (!membershipVisibleTo(user.email)) return { ok: false, error: 'Not available yet.' };
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return { ok: false, error: 'Unknown story.' };

  const db = supabaseServer();
  const { data, error: readError } = await db.from('shelf_items').select('slug').eq('user_id', user.id).eq('slug', slug);
  if (readError) return { ok: false, error: 'Could not save. Try again.' };

  if ((data ?? []).length > 0) {
    const { error } = await db.from('shelf_items').delete().eq('user_id', user.id).eq('slug', slug);
    if (error) return { ok: false, error: 'Could not save. Try again.' };
    revalidatePath('/account/saved');
    return { ok: true, saved: false };
  }
  const { error } = await db.from('shelf_items').insert({ user_id: user.id, slug });
  if (error) return { ok: false, error: 'Could not save. Try again.' };
  revalidatePath('/account/saved');
  return { ok: true, saved: true };
}
