'use server';

import { getSessionUser } from '@/lib/supabase-user';
import { isOwnerEmail } from '@/lib/memberAccess';
import { resendGiftCode } from '@/lib/giftServer';

export async function resendGift(code: string, email: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user || !isOwnerEmail(user.email)) return { ok: false, error: 'Not allowed.' };
  return resendGiftCode(code, email);
}
