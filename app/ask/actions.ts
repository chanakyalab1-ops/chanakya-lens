'use server';

import { getSessionUser } from '@/lib/supabase-user';
import { paidAccess } from '@/lib/entitlements';
import { supabaseServer } from '@/lib/supabase-server';
import { getAllStories } from '@/lib/stories';
import { ASK_DAILY_LIMIT, ASK_GLOBAL_DAILY_LIMIT, buildAskPrompt, citedSlugs, cleanQuestion, pickRelevant } from '@/lib/ask';

export type AskResult =
  | { ok: true; answer: string; sources: { slug: string; headline: string }[]; left: number }
  | { ok: false; error: string };

const dayAgo = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

// Answers a question from Chanakya Lens stories only, with a small daily cap per
// reader and a site-wide cap so the cost can never run away.
export async function askLens(rawQuestion: string): Promise<AskResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  const access = await paidAccess(user);
  if (access === 'hidden') return { ok: false, error: 'Not available yet.' };
  if (access === 'locked') return { ok: false, error: 'Ask the Lens is for Lens+ members.' };
  const question = cleanQuestion(rawQuestion);
  if (question.length < 8) return { ok: false, error: 'Ask a full question.' };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: 'Ask the Lens is not set up.' };

  const stories = pickRelevant(question, await getAllStories());
  if (stories.length === 0) return { ok: false, error: 'We have not covered that yet, so there is nothing to answer from.' };

  const db = supabaseServer();
  const [mine, all] = await Promise.all([
    db.from('ask_log').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', dayAgo()),
    db.from('ask_log').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo()),
  ]);
  if (mine.error || all.error) return { ok: false, error: 'Ask the Lens is not ready yet.' };
  const used = mine.count ?? 0;
  if (used >= ASK_DAILY_LIMIT) return { ok: false, error: `You have used your ${ASK_DAILY_LIMIT} questions for today. Try again tomorrow.` };
  if ((all.count ?? 0) >= ASK_GLOBAL_DAILY_LIMIT) return { ok: false, error: 'Ask the Lens is busy today. Try again tomorrow.' };

  const { system, user: prompt } = buildAskPrompt(question, stories);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, system, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) return { ok: false, error: 'Could not answer right now. Try again.' };
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const answer = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('').trim();
  if (!answer) return { ok: false, error: 'Could not answer right now. Try again.' };

  await db.from('ask_log').insert({ user_id: user.id });
  const cited = new Set(citedSlugs(answer, stories));
  const sources = stories.filter((s) => cited.has(s.slug)).map((s) => ({ slug: s.slug, headline: s.headline }));
  return { ok: true, answer: answer.replace(/\s*\[[a-z0-9-]+\]/g, ''), sources, left: ASK_DAILY_LIMIT - used - 1 };
}
