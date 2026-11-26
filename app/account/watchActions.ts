'use server';

import { getSessionUser } from '@/lib/supabase-user';
import { paidAccess } from '@/lib/entitlements';
import { supabaseServer } from '@/lib/supabase-server';

// Watch or stop watching a single story for update alerts.
export async function toggleWatch(slug: string): Promise<{ ok: true; watching: boolean } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  const access = await paidAccess(user);
  if (access === 'hidden') return { ok: false, error: 'Not available yet.' };
  if (access === 'locked') return { ok: false, error: 'Watching a story is for Lens+ members.' };
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return { ok: false, error: 'Unknown story.' };
  const db = supabaseServer();
  const { data, error: readError } = await db.from('story_watches').select('slug').eq('user_id', user.id).eq('slug', slug);
  if (readError) return { ok: false, error: 'Could not save. Try again.' };
  if ((data ?? []).length > 0) {
    const { error } = await db.from('story_watches').delete().eq('user_id', user.id).eq('slug', slug);
    return error ? { ok: false, error: 'Could not save. Try again.' } : { ok: true, watching: false };
  }
  const { error } = await db.from('story_watches').insert({ user_id: user.id, slug });
  return error ? { ok: false, error: 'Could not save. Try again.' } : { ok: true, watching: true };
}
