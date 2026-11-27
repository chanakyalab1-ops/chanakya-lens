'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { savePost, deleteMyDraft } from './actions';
import { DispatchBody } from '@/components/DispatchBody';
import { parseBlocks } from '@/lib/miniMarkdown';
import { MIN_WORDS_TO_PUBLISH, STATUS_LABEL, readMinutes, wordCount, type PostStatus } from '@/lib/analystDesk';

type Initial = { id: string; storySlug: string; title: string; body: string; status: PostStatus; editorNote: string; slug: string };

const field = 'w-full rounded-sm border px-3 py-2 bg-transparent text-sm';
const bd = { borderColor: 'var(--border)' };

export function PostEditor({ initial, locked, isOwner, stories, presetStory = '' }: { initial: Initial | null; locked: boolean; isOwner: boolean; stories: { slug: string; headline: string }[]; presetStory?: string }) {
  const router = useRouter();
  const [storySlug, setStorySlug] = useState(initial?.storySlug ?? presetStory);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const words = wordCount(body);
  const blocks = useMemo(() => parseBlocks(body), [body]);

  function save(publish: boolean) {
    if (publish && !window.confirm('Publish this now? It goes live straight away under the story. You can still edit it later.')) return;
    setMsg(null);
    start(async () => {
      const r = await savePost({ id: initial?.id, storySlug, title, body, publish });
      if (!r.ok) return setMsg({ ok: false, text: r.error ?? 'Could not save.' });
      setMsg({ ok: true, text: publish ? 'Published.' : 'Saved.' });
      if (publish && !initial) router.push('/writer');
      else if (!initial && r.id) router.replace(`/writer/${r.id}`);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {initial && (
        <div className="font-mono text-[0.6875rem] uppercase tracking-widest" style={{ color: 'var(--text-on-ink-dim)' }}>Status: {STATUS_LABEL[initial.status]}{initial.status === 'published' ? ' · changes you save are live straight away' : ''}</div>
      )}
      {initial?.status === 'changes' && initial.editorNote && (
        <div className="rounded-sm border-l-4 border p-4" style={{ borderColor: 'var(--border)', borderLeftColor: 'var(--developing)', background: 'var(--ink-card)' }}>
          <div className="font-mono text-[0.6875rem] uppercase tracking-widest mb-1" style={{ color: 'var(--developing)' }}>From the editor, please fix and publish again</div>
          <p className="text-[0.92rem]" style={{ color: 'var(--text-body)' }}>{initial.editorNote}</p>
        </div>
      )}
      {locked && (
        <div className="rounded-sm border p-4 text-sm" style={{ borderColor: '#0E7080', background: 'var(--ink-card)' }}>
          This piece is read-only right now.
        </div>
      )}

      <label className="block text-xs" style={{ color: 'var(--text-on-ink-dim)' }}>
        Is this about one of our stories? (optional)
        <select value={storySlug} onChange={(e) => setStorySlug(e.target.value)} disabled={locked} className={`${field} mt-1`} style={bd}>
          <option value="">No, it stands on its own</option>
          {stories.map((s) => (
            <option key={s.slug} value={s.slug}>{s.headline.length > 110 ? `${s.headline.slice(0, 109)}…` : s.headline}</option>
          ))}
        </select>
      </label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={locked} maxLength={150} placeholder="Heading" className={`${field} text-lg font-semibold`} style={bd} />
      <div className="flex items-center justify-between">
        <div className="text-xs" style={{ color: 'var(--text-on-ink-dim)' }}>
          {words.toLocaleString('en-GB')} words · {readMinutes(body)} min read{!isOwner && initial?.status !== 'published' && words < MIN_WORDS_TO_PUBLISH ? ` · ${MIN_WORDS_TO_PUBLISH - words} more to publish` : ''}
        </div>
        <div className="flex gap-1 text-xs">
          <button type="button" onClick={() => setPreview(false)} className="px-3 py-1 rounded-sm border" style={{ ...bd, background: !preview ? 'var(--ink-card)' : 'transparent' }}>Write</button>
          <button type="button" onClick={() => setPreview(true)} className="px-3 py-1 rounded-sm border" style={{ ...bd, background: preview ? 'var(--ink-card)' : 'transparent' }}>Preview</button>
        </div>
      </div>

      {preview ? (
        <div className="rounded-sm border p-5 min-h-[20rem]" style={bd}>
          <h2 className="font-display font-extrabold text-3xl mb-2">{title || 'Untitled'}</h2>
          <DispatchBody blocks={blocks} />
        </div>
      ) : (
        <>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} disabled={locked} rows={22} placeholder="Write your analysis here" className={`${field} font-mono leading-relaxed`} style={bd} />
          <p className="text-xs" style={{ color: 'var(--text-on-ink-dim)' }}>
            Optional: <code>## Subheading</code> for a section, <code>**bold**</code>, a blank line between paragraphs.
          </p>
        </>
      )}

      {!locked && (
        <div className="flex items-center gap-3 flex-wrap pt-2">
          <button disabled={pending} onClick={() => save(false)} className="px-5 py-2.5 text-sm font-semibold rounded-sm border disabled:opacity-50" style={bd}>
            {pending ? 'Saving…' : initial?.status === 'published' ? 'Save changes' : 'Save draft'}
          </button>
          {initial?.status !== 'published' && (
            <button disabled={pending} onClick={() => save(true)} className="px-5 py-2.5 text-sm font-semibold rounded-sm text-white disabled:opacity-50" style={{ background: '#0E7080' }}>
              Publish
            </button>
          )}
          {initial?.status === 'draft' && (
            <button
              disabled={pending}
              onClick={() => window.confirm('Delete this draft?') && start(async () => { const r = await deleteMyDraft(initial.id); if (r.ok) router.push('/writer'); else setMsg({ ok: false, text: r.error ?? 'Could not delete.' }); })}
              className="text-xs underline"
              style={{ color: 'var(--text-on-ink-dim)' }}
            >
              Delete draft
            </button>
          )}
          {msg && <span className="text-sm" style={{ color: msg.ok ? 'var(--possible)' : 'var(--developing)' }}>{msg.text}</span>}
        </div>
      )}
    </div>
  );
}
