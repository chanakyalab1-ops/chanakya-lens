'use server';

import { generateVAPIDKeys } from 'web-push';
import { getSessionUser } from '@/lib/supabase-user';
import { isOwnerEmail } from '@/lib/memberAccess';

// Makes a fresh sending key pair for browser notifications. Owner only; the private
// key goes to the owner's screen once and is never stored by the site.
export async function generateVapidKeys(): Promise<{ ok: true; publicKey: string; privateKey: string } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!isOwnerEmail(user?.email)) return { ok: false, error: 'Not allowed.' };
  const keys = generateVAPIDKeys();
  return { ok: true, publicKey: keys.publicKey, privateKey: keys.privateKey };
}
