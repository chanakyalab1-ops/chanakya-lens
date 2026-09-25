'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { slugify } from '@/lib/slug';
import { generateStoryDraft } from '@/lib/anthropic-server';
import { selectImageForStory } from '@/lib/imageSelection';

// Every path that creates a draft holds it at workflow_status='fact_checking'
// (invisible to the /review queue) and fires this so a reviewer never sees
// a draft that hasn't actually been fact-checked yet. /api/fact-check flips
// it to 'in_review' when done (or failed -- it still needs to surface, just
// flagged as unverified rather than withheld forever).
function triggerFactCheck(draftId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chanakyalens.com';
  after(async () => {
    await fetch(`${baseUrl}/api/fact-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: draftId }),
    }).catch(() => {});
  });
}

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
  chanakyaAnalysis: string;
  offLens: string;
};

// Every action below returns { ok, error } instead of throwing. Next.js
// redacts a Server Action's thrown Error message to a generic
// "Minified React error #<n>" digest in production builds -- ALWAYS,
// regardless of how descriptive the throw was -- so a plain `throw new
// Error(...)` here would never actually reach the reviewer, on any failure,
// not just this one. Catching internally and returning the real message is
// the only way an error is visible in production at all.
export type ActionResult<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; data: T } | { ok: false; error: string };

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}

export async function createDraft(input: CreateDraftInput): Promise<ActionResult<{ slug: string }>> {
  try {
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

    const { data: newDraft, error: draftError } = await supabase.from('story_drafts').insert({
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
      workflow_status: 'fact_checking',
      chanakya_analysis: input.chanakyaAnalysis.trim() || null,
      off_lens: input.offLens.trim() || null,
    }).select('id').single();

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

    if (newDraft?.id) triggerFactCheck(newDraft.id);

    revalidatePath('/review');
    return { ok: true, data: { slug } };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

export async function updateDraft(slug: string, input: CreateDraftInput): Promise<ActionResult> {
  try {
    const supabase = supabaseServer();

    if (!input.headline.trim() || !input.body.trim()) {
      throw new Error('Headline and body are required.');
    }

    const { error } = await supabase
      .from('story_drafts')
      .update({
        category: input.category || null,
        status: input.statusTag,
        headline: input.headline.trim(),
        dek: input.dek.trim() || null,
        body: input.body.trim(),
        read_time: input.readTime.trim() || null,
        has_video: input.hasVideo,
        impact_nodes: input.impactNodes,
        articles: input.articles.map((a) => ({ candidate_id: a.candidateId, role: a.role })),
        chanakya_analysis: input.chanakyaAnalysis.trim() || null,
        off_lens: input.offLens.trim() || null,
      })
      .eq('slug', slug);

    if (error) {
      throw new Error(`Failed to update draft: ${error.message}`);
    }

    revalidatePath('/review');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

export async function dismissCandidates(candidateIds: string[]): Promise<ActionResult> {
  if (candidateIds.length === 0) return { ok: true };
  try {
    const supabase = supabaseServer();
    const { error } = await supabase
      .from('story_candidates')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .in('id', candidateIds);
    if (error) throw new Error(`Failed to dismiss candidates: ${error.message}`);
    revalidatePath('/review');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

// Copies the draft into `stories` (the only thing that makes it live),
// resolving its linked candidates into a self-contained source snapshot,
// selecting the best available image (Wikimedia vs Pexels, scored, or none
// if neither clears the quality bar), then marks the draft published.
// `stories` is otherwise never written to.
export type PublishFeedback = {
  reason?: string;
  tags?: string[];
  rating?: number;
};

export async function publishDraft(slug: string, feedback?: PublishFeedback): Promise<ActionResult> {
  try {
    const supabase = supabaseServer();

    const { data: draft, error: fetchError } = await supabase
      .from('story_drafts')
      .select(
        'slug, category, status, headline, dek, body, read_time, has_video, impact_nodes, articles, chanakya_analysis, off_lens, subject_countries, quality_score',
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

    const image = await selectImageForStory(
      draft.headline,
      draft.body,
      draft.category ?? '',
      draft.subject_countries ?? undefined,
      sources.map((s) => ({ url: s.url, domain: s.domain })),
    );

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
      chanakya_analysis: draft.chanakya_analysis,
      off_lens: draft.off_lens,
      subject_countries: draft.subject_countries ?? null,
      sources,
      image_url: image?.imageUrl ?? null,
      quality_score: draft.quality_score ?? null,
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

    // Best-effort: a failure here shouldn't undo a publish that already
    // succeeded above, so log rather than throw.
    const { error: decisionError } = await supabase.from('draft_decisions').insert({
      draft_slug: slug,
      decision: 'accepted',
      category: draft.category ?? null,
      subject_countries: draft.subject_countries ?? [],
      reason: feedback?.reason?.trim() || null,
      tags: feedback?.tags ?? [],
      rating: feedback?.rating ?? null,
    });
    if (decisionError) {
      console.error(`Failed to log publish decision for ${slug}: ${decisionError.message}`);
    }

    revalidatePath('/review');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

// Rejects a draft and releases its candidates back to the queue so they
// can be reconsidered or bundled into a different story.
export async function rejectDraft(slug: string, reason?: string): Promise<ActionResult> {
  try {
    const supabase = supabaseServer();

    const { error: releaseError } = await supabase
      .from('story_candidates')
      .update({ status: 'pending', story_slug: null })
      .eq('story_slug', slug);
    if (releaseError) {
      throw new Error(`Failed to release candidates: ${releaseError.message}`);
    }

    const { data: draftData } = await supabase
      .from('story_drafts')
      .select('headline, category, subject_countries, quality_score')
      .eq('slug', slug)
      .single();

    const { error: statusError } = await supabase
      .from('story_drafts')
      .update({ workflow_status: 'rejected' })
      .eq('slug', slug);
    if (statusError) {
      throw new Error(`Failed to reject draft: ${statusError.message}`);
    }

    // Best-effort, same as publishDraft: a logging failure shouldn't look
    // like a failed reject when the reject itself already succeeded above.
    const { error: decisionError } = await supabase.from('draft_decisions').insert({
      draft_slug: slug,
      decision: 'rejected',
      reason: reason ?? null,
      category: draftData?.category ?? null,
      subject_countries: draftData?.subject_countries ?? [],
      quality_score: draftData?.quality_score ?? null,
    });
    if (decisionError) {
      console.error(`Failed to log reject decision for ${slug}: ${decisionError.message}`);
    }

    revalidatePath('/review');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

export async function generateDraft(candidateIds: string[]): Promise<ActionResult<{ slug: string }>> {
  try {
    const supabase = supabaseServer();

    if (candidateIds.length === 0) {
      throw new Error('Select at least one candidate.');
    }

    const { data: candidateRows, error: candidatesError } = await supabase
      .from('story_candidates')
      .select('id, title, domain, source_country, url')
      .in('id', candidateIds);

    if (candidatesError || !candidateRows || candidateRows.length === 0) {
      throw new Error(`Failed to load candidates: ${candidatesError?.message}`);
    }

    const generated = await generateStoryDraft({
      articles: candidateRows.map((c) => ({
        title: c.title,
        domain: c.domain,
        sourceCountry: c.source_country,
        url: c.url,
      })),
    });

    const baseSlug = slugify(generated.headline);
    if (!baseSlug) throw new Error('Generated headline was empty.');

    let slug = baseSlug;
    for (let attempt = 0; attempt < 5; attempt++) {
      const [{ data: storyHit }, { data: draftHit }] = await Promise.all([
        supabase.from('stories').select('slug').eq('slug', slug).maybeSingle(),
        supabase.from('story_drafts').select('slug').eq('slug', slug).maybeSingle(),
      ]);
      if (!storyHit && !draftHit) break;
      slug = `${baseSlug}-${attempt + 2}`;
    }

    const { data: newDraft, error: draftError } = await supabase.from('story_drafts').insert({
      slug,
      category: generated.category || null,
      status: generated.statusTag,
      headline: generated.headline.trim(),
      dek: generated.dek?.trim() || null,
      body: generated.body.trim(),
      read_time: generated.readTime?.trim() || '3 min',
      has_video: false,
      impact_nodes: generated.impactNodes ?? [],
      articles: candidateRows.map((c, i) => ({
        candidate_id: c.id,
        role: i === 0 ? 'primary' : 'source',
      })),
      chanakya_analysis: generated.chanakyaAnalysis,
      off_lens: generated.offLens,
      subject_countries: generated.subjectCountries ?? [],
      workflow_status: 'fact_checking',
    }).select('id').single();

    if (draftError) {
      throw new Error(`Failed to save generated draft: ${draftError.message}`);
    }

    const { error: candidateError } = await supabase
      .from('story_candidates')
      .update({ status: 'approved', story_slug: slug, reviewed_at: new Date().toISOString() })
      .in('id', candidateIds);
    if (candidateError) {
      throw new Error(`Failed to update candidate status: ${candidateError.message}`);
    }

    if (newDraft?.id) triggerFactCheck(newDraft.id);

    revalidatePath('/review');
    return { ok: true, data: { slug } };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

export async function triggerAutoGenerateBatch(limit: number): Promise<ActionResult<{ batchId: string; groupCount: number }>> {
  try {
    const { autoGenerateBatch } = await import('@/lib/auto-generate');
    const result = await autoGenerateBatch(limit);
    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

export type UpdatePublishedStoryInput = {
  headline: string;
  dek: string;
  body: string;
  category: string;
  readTime: string;
  hasVideo: boolean;
  statusTag: StatusTag;
  impactNodes: ImpactNode[];
  chanakyaAnalysis: string;
  offLens: string;
};

export async function updatePublishedStory(slug: string, input: UpdatePublishedStoryInput): Promise<ActionResult> {
  try {
    const supabase = supabaseServer();

    if (!input.headline.trim() || !input.body.trim()) {
      throw new Error('Headline and body are required.');
    }

    const { error } = await supabase
      .from('stories')
      .update({
        headline: input.headline.trim(),
        dek: input.dek.trim() || input.headline.trim(),
        body: input.body.trim(),
        category: input.category || null,
        status: input.statusTag,
        read_time: input.readTime.trim() || '3 min',
        has_video: input.hasVideo,
        impact_nodes: input.impactNodes,
        chanakya_analysis: input.chanakyaAnalysis.trim() || null,
        off_lens: input.offLens.trim() || null,
      })
      .eq('slug', slug);

    if (error) {
      throw new Error(`Failed to update story: ${error.message}`);
    }

    revalidatePath('/review/manage');
    revalidatePath(`/story/${slug}`);
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

// Removes a story from the live site entirely. Does not touch its source
// candidates or the original draft record, if either still exist.
export async function unpublishStory(slug: string): Promise<ActionResult> {
  try {
    const supabase = supabaseServer();

    const { error } = await supabase.from('stories').delete().eq('slug', slug);
    if (error) {
      throw new Error(`Failed to unpublish: ${error.message}`);
    }

    revalidatePath('/review/manage');
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}
