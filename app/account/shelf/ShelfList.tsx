'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { saveShelfNote, toggleShelf } from './actions';
import { NOTE_MAX } from '@/lib/shelf';

type Item = { slug: string; headline: string; category: string; note: string };

export function ShelfList({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();

  function remove(slug: string) {
    start(async () => {
      const res = await toggleShelf(slug);
      if (res.ok) setItems((p) => p.filter((i) => i.slug !== slug));
    });
  }

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <article key={it.slug} className="rounded-sm border p-4" style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}>
          <div className="font-mono text-[0.62rem] uppercase mb-1" style={{ color: 'var(--brand-soft)' }}>{it.category}</div>
          <Link href={`/story/${it.slug}`} className="block text-[0.95rem] font-semibold leading-snug hover:opacity-80">
            {it.headline}
          </Link>
          <NoteEditor slug={it.slug} initial={it.note} />
          <button onClick={() => remove(it.slug)} disabled={pending} className="mt-3 font-mono text-[0.62rem] uppercase tracking-wide underline disabled:opacity-60" style={{ color: 'var(--text-on-ink-dim)' }}>
            Remove from Shelf
          </button>
        </article>
      ))}
    </div>
  );
}

function NoteEditor({ slug, initial }: { slug: string; initial: string }) {
  const [note, setNote] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = note.trim() !== saved;
  return (
    <div className="mt-3">
      <label className="font-mono text-[0.6rem] uppercase tracking-widest block mb-1" style={{ color: 'var(--text-on-ink-dim)' }}>
        Why you kept it (private)
      </label>
      <textarea
        value={note}
        maxLength={NOTE_MAX}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="A line to remind you later"
        className="w-full rounded-sm border p-2 text-sm bg-transparent"
        style={{ borderColor: 'var(--border)' }}
      />
      {dirty && (
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await saveShelfNote(slug, note);
              if (r.ok) setSaved(note.trim());
            })
          }
          className="mt-1 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: '#0E7080' }}
        >
          Save note
        </button>
      )}
    </div>
  );
}
