'use server';

import { getSessionUser } from '@/lib/supabase-user';
import { membershipVisibleTo } from '@/lib/memberAccess';
import { redeemGiftCode, type RedeemResult } from '@/lib/giftServer';

export async function redeemGift(code: string): Promise<RedeemResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  if (!membershipVisibleTo(user.email)) return { ok: false, error: 'Not available yet.' };
  return redeemGiftCode(user.id, code);
}
