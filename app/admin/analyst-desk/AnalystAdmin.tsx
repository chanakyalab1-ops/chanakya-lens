'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { addAnalyst, publishPost, requestChanges, setAnalystActive, setAnalystShowEmail, unpublishPost } from './actions';
import { STATUS_LABEL, wordCount, type Analyst, type Post } from '@/lib/analystDesk';

const field = 'w-full rounded-sm border px-3 py-2 bg-transparent text-sm';
const bd = { borderColor: 'var(--border)' };
const dim = { color: 'var(--text-on-ink-dim)' };
const btn = 'px-3 py-1.5 text-xs font-semibold rounded-sm border hover:opacity-80 disabled:opacity-50';

export function AnalystAdmin({ analysts, posts, headlines = {} }: { analysts: Analyst[]; posts: Post[]; headlines?: Record<string, string> }) {
  const waiting = posts.filter((p) => p.status === 'submitted');
  const changes = posts.filter((p) => p.status === 'changes');
  const drafts = posts.filter((p) => p.status === 'draft');
  const published = posts.filter((p) => p.status === 'published');
  return (
    <div className="space-y-8">
      <Writers analysts={analysts} />
      <Group title={`Live (${published.length})`} posts={published} headlines={headlines} empty="Nothing published yet. Pieces go live as soon as a writer publishes them." />
      <Group title={`Sent back for changes (${changes.length})`} posts={changes} headlines={headlines} />
      {waiting.length > 0 && <Group title={`Waiting for you (${waiting.length})`} posts={waiting} headlines={headlines} accent />}
      <Group title={`Drafts (${drafts.length})`} posts={drafts} headlines={headlines} />
    </div>
  );
}

function Writers({ analysts }: { analysts: Analyst[] }) {
  const [f, setF] = useState({ email: '', name: '', bio: '', showEmail: false });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="rounded-sm border p-4 space-y-3" style={{ ...bd, background: 'var(--ink-card)' }}>
      <div className="font-mono text-[0.6875rem] uppercase tracking-widest" style={dim}>Writers</div>
      <p className="text-xs" style={dim}>A writer signs in at chanakyalens.com/writer with the email you add here (Continue with Google is easiest). She only ever sees her own pieces.</p>
      {analysts.length > 0 && (
        <ul className="space-y-1.5">
          {analysts.map((a) => (
            <li key={a.email} className="flex items-center justify-between gap-3 text-sm">
              <span><b>{a.name}</b> <span className="text-xs" style={dim}>{a.email}{a.active ? '' : ' · paused'}{a.showEmail ? ' · email shown on her pieces' : ''}</span></span>
              <span className="flex gap-3">
                <button disabled={pending} onClick={() => start(async () => { await setAnalystShowEmail(a.email, !a.showEmail); })} className="text-xs underline" style={dim}>{a.showEmail ? 'Hide email' : 'Show email'}</button>
                <button disabled={pending} onClick={() => start(async () => { await setAnalystActive(a.email, !a.active); })} className="text-xs underline" style={dim}>{a.active ? 'Pause' : 'Reactivate'}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form
        className="grid sm:grid-cols-2 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          start(async () => {
            const r = await addAnalyst(f);
            if (r.ok) { setF({ email: '', name: '', bio: '', showEmail: false }); setMsg('Added.'); } else setMsg(r.error ?? 'Could not add.');
          });
        }}
      >
        <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Her name" className={field} style={bd} />
        <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Her sign-in email" className={field} style={bd} />
        <input value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} maxLength={400} placeholder="Short bio shown under her pieces (optional)" className={`${field} sm:col-span-2`} style={bd} />
        <label className="flex items-center gap-2 text-xs sm:col-span-2" style={dim}>
          <input type="checkbox" checked={f.showEmail} onChange={(e) => setF({ ...f, showEmail: e.target.checked })} /> Show her email under her pieces (only if she agrees: anyone can read it)
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button disabled={pending} className="px-4 py-2 text-sm font-semibold text-white rounded-sm disabled:opacity-60" style={{ background: '#0E7080' }}>Add writer</button>
          {msg && <span className="text-xs" style={dim}>{msg}</span>}
        </div>
      </form>
    </section>
  );
}

function Group({ title, posts, headlines, empty, accent }: { title: string; posts: Post[]; headlines: Record<string, string>; empty?: string; accent?: boolean }) {
  return (
    <section>
      <h2 className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: accent ? 'var(--developing)' : 'var(--brand-soft)' }}>{title}</h2>
      {posts.length === 0 ? (empty ? <p className="text-sm" style={dim}>{empty}</p> : null) : <ul className="space-y-2">{posts.map((p) => <Item key={p.id} p={p} story={p.storySlug ? headlines[p.storySlug] ?? p.storySlug : ''} />)}</ul>}
    </section>
  );
}

function Item({ p, story }: { p: Post; story: string }) {
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await fn(); setMsg(r.ok ? null : r.error ?? 'Failed'); });
  return (
    <li className="rounded-sm border p-3" style={{ ...bd, background: 'var(--ink-card)' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-semibold truncate">{p.title || 'Untitled'}</div>
          {story && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--brand-soft)' }}>On: {story}</div>}
          <div className="text-xs mt-0.5" style={dim}>{p.authorName} · {wordCount(p.body).toLocaleString('en-GB')} words · {STATUS_LABEL[p.status]}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/analyst-desk/${p.slug}`} target="_blank" className={btn} style={bd}>Preview</Link>
          <Link href={`/writer/${p.id}`} className={btn} style={bd}>Edit</Link>
          {p.status !== 'published' && <button disabled={pending} onClick={() => window.confirm('Publish this piece?') && run(() => publishPost(p.id))} className={btn} style={{ ...bd, color: 'var(--possible)' }}>Publish</button>}
          {(p.status === 'published' || p.status === 'submitted') && <button disabled={pending} onClick={() => setAsking(!asking)} className={btn} style={bd}>Request changes</button>}
          {p.status === 'published' && <button disabled={pending} onClick={() => run(() => unpublishPost(p.id))} className={btn} style={bd}>Unpublish</button>}
        </div>
      </div>
      {asking && (
        <div className="mt-3 space-y-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder="What should she change?" className={field} style={bd} />
          <button disabled={pending || !note.trim()} onClick={() => window.confirm(p.status === 'published' ? 'This takes the piece off the site until she fixes it and publishes again. Send back?' : 'Send back?') && run(() => requestChanges(p.id, note))} className={btn} style={bd}>Send back</button>
        </div>
      )}
      {msg && <div className="text-xs mt-2" style={{ color: 'var(--developing)' }}>{msg}</div>}
    </li>
  );
}
