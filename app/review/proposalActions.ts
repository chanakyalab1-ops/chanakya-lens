'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase-server';
import { submitGroups } from '@/lib/auto-generate';
import type { ActionResult } from './actions';

// A single approval can't spend more than this, whatever the page sends.
const MAX_STORIES_PER_APPROVAL = 15;
const MAX_ARTICLES_PER_STORY = 20;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}

function isIdGroups(value: unknown): value is string[][] {
  return (
    Array.isArray(value) &&
    value.every((g) => Array.isArray(g) && g.length > 0 && g.every((id) => typeof id === 'string' && id.length > 0))
  );
}

// Generates the stories a person has approved. This is the only place a
// proposed story turns into spend.
export async function approveProposals(groups: string[][]): Promise<ActionResult<{ batchId: string; groupCount: number }>> {
  try {
    if (!isIdGroups(groups) || groups.length === 0) throw new Error('Select at least one story.');
    if (groups.length > MAX_STORIES_PER_APPROVAL) {
      throw new Error(`Approve at most ${MAX_STORIES_PER_APPROVAL} stories at a time.`);
    }
    const trimmed = groups.map((g) => g.slice(0, MAX_ARTICLES_PER_STORY));

    const result = await submitGroups(trimmed, { enrich: true });
    if (!result.batchId) throw new Error(result.skipped ?? 'Nothing was submitted.');

    revalidatePath('/review/proposals');
    revalidatePath('/admin');
    return { ok: true, data: { batchId: result.batchId, groupCount: result.groupCount } };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

// Dismisses proposed stories: their articles are marked rejected, so they are
// never proposed again.
export async function skipProposals(candidateIds: string[]): Promise<ActionResult<{ skipped: number }>> {
  try {
    if (!Array.isArray(candidateIds) || candidateIds.length === 0 || !candidateIds.every((id) => typeof id === 'string')) {
      throw new Error('Select at least one story.');
    }
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('story_candidates')
      .update({ status: 'rejected' })
      .in('id', candidateIds)
      .eq('status', 'pending')
      .select('id');
    if (error) throw new Error(`Failed to skip: ${error.message}`);

    revalidatePath('/review/proposals');
    return { ok: true, data: { skipped: data?.length ?? 0 } };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}
