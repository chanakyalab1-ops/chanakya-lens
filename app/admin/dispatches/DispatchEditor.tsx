'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteDispatch, saveDispatch } from './actions';
import type { Dispatch } from '@/lib/dispatches';

export function DispatchEditor({ initial }: { initial: Dispatch | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [theme, setTheme] = useState(initial?.theme ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [heroUrl, setHeroUrl] = useState(initial?.heroUrl ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [published, setPublished] = useState(initial?.published ?? false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const input = 'w-full rounded border border-white/15 bg-transparent p-2 text-sm';
  return (
    <div className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={input} />
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme, e.g. Red Sea" className={input} />
        <input value={heroUrl} onChange={(e) => setHeroUrl(e.target.value)} placeholder="Hero image link (https://...)" className={input} />
      </div>
      <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} maxLength={400} placeholder="One or two sentences shown on the list and as the standfirst" className={input} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={22} placeholder="Write the Dispatch here" className={`${input} font-mono`} />
      <p className="text-xs text-[#8A93A6]">
        Formatting: <code>## Heading</code>, <code>### Subheading</code>, blank line between paragraphs, <code>- list item</code>, <code>&gt; quote</code>, <code>**bold**</code>, <code>*italic*</code>, <code>[text](https://link)</code>, and an image on its own line: <code>![what it shows](https://image-link)</code>. Free readers see only the first three blocks, so put the hook up top.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published
      </label>
      <div className="flex items-center gap-3">
        <button
          disabled={pending || !title.trim()}
          onClick={() =>
            start(async () => {
              const r = await saveDispatch({ slug: initial?.slug, title, theme, summary, heroUrl, body, published });
              setMsg(r.ok ? 'Saved.' : r.error);
              if (r.ok) router.push(`/admin/dispatches?edit=${r.slug}`);
              router.refresh();
            })
          }
          className="px-4 py-2 text-sm font-medium rounded bg-[#C97B4A] text-[#0B1220] disabled:opacity-40"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {initial && (
          <>
            <a href={`/dispatches/${initial.slug}`} target="_blank" rel="noreferrer" className="text-sm underline">Preview</a>
            <button
              onClick={() => window.confirm('Delete this Dispatch?') && start(async () => { await deleteDispatch(initial.slug); router.push('/admin/dispatches'); router.refresh(); })}
              className="text-sm underline text-red-300"
            >
              Delete
            </button>
          </>
        )}
        {msg && <span className="text-sm text-[#8A93A6]">{msg}</span>}
      </div>
    </div>
  );
}
