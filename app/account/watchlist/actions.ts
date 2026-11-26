'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase-user';
import { supabaseServer } from '@/lib/supabase-server';
import { canAddInterest, isValidInterest, type InterestKind } from '@/lib/interests';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { getMembership, isActiveMember } from '@/lib/membership';

export type ToggleResult =
  | { ok: true; selected: boolean }
  | { ok: false; error: string; limit?: boolean };

export async function toggleInterest(kind: InterestKind, slug: string): Promise<ToggleResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  if (!membershipVisibleTo(user.email)) return { ok: false, error: 'Not available yet.' };
  if (!isValidInterest({ kind, slug })) return { ok: false, error: 'Unknown interest.' };

  const supabase = supabaseServer();
  const { data: existing, error: readError } = await supabase
    .from('watchlist_items')
    .select('slug')
    .eq('user_id', user.id);
  if (readError) return { ok: false, error: 'Could not save. Try again.' };

  const rows = (existing ?? []) as { slug: string }[];
  const following = rows.some((r) => r.slug === slug);

  if (following) {
    const { error } = await supabase.from('watchlist_items').delete().eq('user_id', user.id).eq('kind', kind).eq('slug', slug);
    if (error) return { ok: false, error: 'Could not save. Try again.' };
    revalidatePath('/account/watchlist');
    return { ok: true, selected: false };
  }

  const isMember = isActiveMember(await getMembership(user.id));
  const membershipPublic = process.env.MEMBERSHIP_PUBLIC === 'true';
  if (!canAddInterest(rows.length, { isMember, membershipPublic })) {
    return { ok: false, error: 'You are following the free limit.', limit: true };
  }

  const { error } = await supabase.from('watchlist_items').insert({ user_id: user.id, kind, slug });
  if (error) return { ok: false, error: 'Could not save. Try again.' };
  revalidatePath('/account/watchlist');
  return { ok: true, selected: true };
}
