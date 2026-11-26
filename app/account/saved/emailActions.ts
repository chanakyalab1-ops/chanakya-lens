'use server';

import { getSessionUser } from '@/lib/supabase-user';
import { paidAccess } from '@/lib/entitlements';
import { getStoryBySlug } from '@/lib/stories';
import { storyEmailHtml } from '@/lib/storyEmail';
import { brevoConfigured, resendConfigured, sendEmail } from '@/lib/emailSend';

// Emails a story to the signed-in reader's own address.
export async function emailStoryToMe(slug: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user?.email) return { ok: false, error: 'Sign in first.' };
  const access = await paidAccess(user);
  if (access === 'hidden') return { ok: false, error: 'Not available yet.' };
  if (access === 'locked') return { ok: false, error: 'Email me is for Lens+ members.' };
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return { ok: false, error: 'Unknown story.' };
  const story = await getStoryBySlug(slug);
  if (!story) return { ok: false, error: 'Unknown story.' };
  const provider = brevoConfigured() ? 'brevo' : resendConfigured() ? 'resend' : null;
  if (!provider) return { ok: false, error: 'Email is not set up.' };
  const res = await sendEmail({ to: user.email, subject: story.headline, html: storyEmailHtml(story) }, provider);
  return res.ok ? { ok: true } : { ok: false, error: 'Could not send. Try again.' };
}
