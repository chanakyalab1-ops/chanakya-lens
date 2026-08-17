'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase-server';
import { slugify } from '@/lib/slug';

export type ArticleRole = 'primary' | 'local' | 'international' | 'source';
export type Confidence = 'direct' | 'likely' | 'possible';
export type StatusTag = 'developing' | 'settled' | null;

export type ImpactNode = {
  audience: string;
  mechanism: string;
  confidence: Confidence;
};

export type CreateDraftInput = {
  headline: string;
  dek: string;
  body: string;
  category: string;
  readTime: string;
  hasVideo: boolean;
  statusTag: StatusTag;
  articles: { candidateId: string; role: ArticleRole }[];
  impactNodes: ImpactNode[];
};

export async function createDraft(input: CreateDraftInput) {
  const supabase = supabaseServer();

  if (!input.headline.trim() || !input.body.trim()) {
    throw new Error('Headline and body are required.');
  }
  if (input.articles.length === 0) {
    throw new Error('Select at least one source article.');
  }

  const baseSlug = slugify(input.headline);
  if (!baseSlug) throw new Error('Headline must contain at least one word.');

  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const [{ data: storyHit }, { data: draftHit }] = await Promise.all([
      supabase.from('stories').select('slug').eq('slug', slug).maybeSingle(),
      supabase.from('story_drafts').select('slug').eq('slug', slug).maybeSingle(),
    ]);
    if (!storyHit && !draftHit) break;
    slug = `${baseSlug}-${attempt + 2}`;
  }

  const { error: draftError } = await supabase.from('story_drafts').insert({
    slug,
    category: input.category || null,
    status: input.statusTag,
    headline: input.headline.trim(),
    dek: input.dek.trim() || null,
    body: input.body.trim(),
    read_time: input.readTime.trim() || null,
    has_video: input.hasVideo,
    impact_nodes: input.impactNodes,
    articles: input.articles.map((a) => ({ candidate_id: a.candidateId, role: a.role })),
    workflow_status: 'in_review',
  });

  if (draftError) {
    throw new Error(`Failed to create draft: ${draftError.message}`);
  }

  const { error: candidateError } = await supabase
    .from('story_candidates')
    .update({ status: 'approved', story_slug: slug, reviewed_at: new Date().toISOString() })
    .in(
      'id',
      input.articles.map((a) => a.candidateId),
    );
  if (candidateError) {
    throw new Error(`Failed to update candidate status: ${candidateError.message}`);
  }

  revalidatePath('/review');
  return slug;
}

export async function dismissCandidates(candidateIds: string[]) {
  if (candidateIds.length === 0) return;
  const supabase = supabaseServer();
  const { error } = await supabase
    .from('story_candidates')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .in('id', candidateIds);
  if (error) throw new Error(`Failed to dismiss candidates: ${error.message}`);
  revalidatePath('/review');
}

// Copies the draft into `stories` (the only thing that makes it live),
// resolving its linked candidates into a self-contained source snapshot,
// then marks the draft published. `stories` is otherwise never written to.
export async function publishDraft(slug: string) {
  const supabase = supabaseServer();

  const { data: draft, error: fetchError } = await supabase
    .from('story_drafts')
    .select(
      'slug, category, status, headline, dek, body, read_time, has_video, impact_nodes, articles',
    )
    .eq('slug', slug)
    .single();

  if (fetchError || !draft) {
    throw new Error(`Failed to load draft: ${fetchError?.message}`);
  }

  const articleLinks = (draft.articles ?? []) as { candidate_id: string; role: ArticleRole }[];
  const candidateIds = articleLinks.map((a) => a.candidate_id);

  const { data: candidateRows, error: candidatesError } = await supabase
    .from('story_candidates')
    .select('id, url, title, domain, source_country')
    .in('id', candidateIds);

  if (candidatesError) {
    throw new Error(`Failed to resolve source articles: ${candidatesError.message}`);
  }

  const candidateById = new Map((candidateRows ?? []).map((c) => [c.id, c]));
  const sources = articleLinks
    .map((link) => {
      const c = candidateById.get(link.candidate_id);
      if (!c) return null;
      return {
        url: c.url,
        title: c.title,
        domain: c.domain,
        source_country: c.source_country,
        role: link.role,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const { error: insertError } = await supabase.from('stories').insert({
    slug: draft.slug,
    category: draft.category,
    status: draft.status,
    headline: draft.headline,
    dek: draft.dek ?? draft.headline,
    body: draft.body,
    read_time: draft.read_time ?? '3 min',
    has_video: draft.has_video,
    impact_nodes: draft.impact_nodes,
    sources,
  });

  if (insertError) {
    throw new Error(`Failed to publish story: ${insertError.message}`);
  }

  const { error: statusError } = await supabase
    .from('story_drafts')
    .update({ workflow_status: 'published' })
    .eq('slug', slug);
  if (statusError) {
    throw new Error(`Published, but failed to update draft status: ${statusError.message}`);
  }

  revalidatePath('/review');
}

// Rejects a draft and releases its candidates back to the queue so they
// can be reconsidered or bundled into a different story.
export async function rejectDraft(slug: string) {
  const supabase = supabaseServer();

  const { error: releaseError } = await supabase
    .from('story_candidates')
    .update({ status: 'pending', story_slug: null })
    .eq('story_slug', slug);
  if (releaseError) {
    throw new Error(`Failed to release candidates: ${releaseError.message}`);
  }

  const { error: statusError } = await supabase
    .from('story_drafts')
    .update({ workflow_status: 'rejected' })
    .eq('slug', slug);
  if (statusError) {
    throw new Error(`Failed to reject draft: ${statusError.message}`);
  }

  revalidatePath('/review');
}