'use client';

import { useEffect, useState, useTransition } from 'react';
import { addCreator, addCreatorsBulk, markSent, removeDraft, setOutreachStatus, updateCreatorDetails } from './actions';
import { buildEmail, buildFollowup, gmailComposeUrl, isPersonalised, needsFollowup, parseBulk, type OutreachVersion } from '@/lib/outreachEmail';

export type OutreachRow = {
  id: string;
  name: string;
  email: string;
  channel_url: string;
  video_title: string;
  topic: string;
  specific: string;
  version: OutreachVersion;
  status: 'draft' | 'sent' | 'replied' | 'yes' | 'no';
  sent_at: string | null;
  followup_sent_at: string | null;
  created_at: string;
};

const field = 'w-full rounded-sm border px-3 py-2 bg-transparent text-sm';
const bd = { borderColor: 'var(--border)' };
const dim = { color: 'var(--text-on-ink-dim)' };
const link = { color: 'var(--brand-soft)' };

export function OutreachBoard({ rows }: { rows: OutreachRow[] }) {
  const [sender, setSender] = useState('');
  const [now] = useState(() => Date.now());
  useEffect(() => {
    try {
      setTimeout(() => setSender(localStorage.getItem('cl_outreach_sender') ?? ''), 0);
    } catch {}
  }, []);
  const saveSender = (v: string) => {
    setSender(v);
    try {
      localStorage.setItem('cl_outreach_sender', v);
    } catch {}
  };

  const due = rows.filter((r) => needsFollowup(r, now));
  const drafts = rows.filter((r) => r.status === 'draft');
  const waiting = rows.filter((r) => r.status === 'sent' && !needsFollowup(r, now));
  const done = rows.filter((r) => ['replied', 'yes', 'no'].includes(r.status));
  const sentToday = rows.filter((r) => r.sent_at && now - new Date(r.sent_at).getTime() < 86400000).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-xs flex-1 min-w-[12rem]" style={dim}>
          Your name (used to sign the emails, saved on this device)
          <input value={sender} onChange={(e) => saveSender(e.target.value)} className={`${field} mt-1`} style={bd} placeholder="Your name" />
        </label>
        <div className="text-xs pb-2" style={dim}>
          Sent in the last 24 hours: <b style={{ color: sentToday > 15 ? 'var(--developing)' : 'var(--text-on-ink)' }}>{sentToday}</b> (keep it under 15)
        </div>
      </div>

      <AddForm />
      <BulkAdd />

      {due.length > 0 && <Group title={`Follow-up due (${due.length})`} rows={due} sender={sender} now={now} />}
      <Group title={`To send (${drafts.length})`} rows={drafts} sender={sender} now={now} empty="No drafts. Add a creator above." />
      <Group title={`Waiting for a reply (${waiting.length})`} rows={waiting} sender={sender} now={now} />
      <Group title={`Replied or done (${done.length})`} rows={done} sender={sender} now={now} />
    </div>
  );
}

function AddForm() {
  const [f, setF] = useState({ name: '', email: '', channelUrl: '', videoTitle: '', topic: '', specific: '', version: 'geo' as OutreachVersion });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <form
      className="rounded-sm border p-4 space-y-3"
      style={{ ...bd, background: 'var(--ink-card)' }}
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await addCreator(f);
          if (r.ok) {
            setF({ name: '', email: '', channelUrl: '', videoTitle: '', topic: '', specific: '', version: f.version });
            setMsg('Added to your drafts.');
          } else setMsg(r.error ?? 'Could not add.');
        });
      }}
    >
      <div className="font-mono text-[0.6875rem] uppercase tracking-widest" style={dim}>Add a creator</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input required value={f.name} onChange={set('name')} placeholder="Their name" className={field} style={bd} />
        <input required type="email" value={f.email} onChange={set('email')} placeholder="Business email (from their About page)" className={field} style={bd} />
        <input value={f.channelUrl} onChange={set('channelUrl')} placeholder="Channel or site link (for your reference)" className={field} style={bd} />
        <select value={f.version} onChange={set('version')} className={field} style={bd}>
          <option value="geo">Geopolitics and current affairs</option>
          <option value="econ">Indian economy and finance</option>
        </select>
        <input value={f.videoTitle} onChange={set('videoTitle')} placeholder="A video or post you really watched" className={field} style={bd} />
        <input value={f.topic} onChange={set('topic')} placeholder="Its topic, e.g. oil prices" className={field} style={bd} />
      </div>
      <input value={f.specific} onChange={set('specific')} placeholder="One specific thing you liked: explain the shipping angle" className={field} style={bd} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className="px-4 py-2 text-sm font-semibold text-white rounded-sm disabled:opacity-60" style={{ background: '#0E7080' }}>{pending ? 'Adding…' : 'Add'}</button>
        {msg && <span className="text-xs" style={dim}>{msg}</span>}
      </div>
    </form>
  );
}

function BulkAdd() {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const parsed = parseBulk(text);
  return (
    <details className="rounded-sm border p-4" style={{ ...bd, background: 'var(--ink-card)' }}>
      <summary className="cursor-pointer font-mono text-[0.6875rem] uppercase tracking-widest" style={dim}>Add many at once</summary>
      <p className="text-xs mt-3 mb-2" style={dim}>One creator per line: name | email | @handle | geo or econ (the last two are optional). They are added as drafts. Before you can open the email in Gmail you add the video you watched and one thing you liked.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className={`${field} font-mono`} style={bd} placeholder={'Tanya Vats | name@gmail.com | @tanyaavats_ | geo'} />
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <button
          disabled={pending || parsed.rows.length === 0}
          onClick={() =>
            start(async () => {
              const r = await addCreatorsBulk(parsed.rows);
              setMsg(r.ok ? `Added ${r.added}${r.skipped ? `, skipped ${r.skipped} already on the list` : ''}.` : r.error ?? 'Could not add.');
              if (r.ok) setText('');
            })
          }
          className="px-4 py-2 text-sm font-semibold text-white rounded-sm disabled:opacity-50"
          style={{ background: '#0E7080' }}
        >
          {pending ? 'Adding…' : `Add ${parsed.rows.length || ''} as drafts`}
        </button>
        {parsed.errors.length > 0 && <span className="text-xs" style={{ color: 'var(--developing)' }}>{parsed.errors.join(' · ')}</span>}
        {msg && <span className="text-xs" style={dim}>{msg}</span>}
      </div>
    </details>
  );
}

function DraftDetails({ r }: { r: OutreachRow }) {
  const [f, setF] = useState({ videoTitle: r.video_title, topic: r.topic, specific: r.specific, version: r.version });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: 'videoTitle' | 'topic' | 'specific') => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div className="mt-3 space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <input value={f.videoTitle} onChange={set('videoTitle')} placeholder="A video or post you really watched" className={field} style={bd} />
        <input value={f.topic} onChange={set('topic')} placeholder="Its topic, e.g. oil prices" className={field} style={bd} />
      </div>
      <input value={f.specific} onChange={set('specific')} placeholder="One specific thing you liked: explain the shipping angle" className={field} style={bd} />
      <div className="flex items-center gap-3 flex-wrap">
        <select value={f.version} onChange={(e) => setF((p) => ({ ...p, version: e.target.value as OutreachVersion }))} className="rounded-sm border px-2 py-1 bg-transparent text-xs" style={bd}>
          <option value="geo">Geopolitics wording</option>
          <option value="econ">Economy and India wording</option>
        </select>
        <button
          disabled={pending}
          onClick={() => start(async () => { const x = await updateCreatorDetails(r.id, f); setMsg(x.ok ? 'Saved.' : x.error ?? 'Failed'); })}
          className="px-3 py-1.5 text-xs font-semibold rounded-sm border hover:opacity-80 disabled:opacity-50"
          style={bd}
        >
          Save details
        </button>
        {msg && <span className="text-xs" style={dim}>{msg}</span>}
      </div>
    </div>
  );
}

function Group({ title, rows, sender, now, empty }: { title: string; rows: OutreachRow[]; sender: string; now: number; empty?: string }) {
  return (
    <section>
      <h2 className="font-mono text-[0.6875rem] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-soft)' }}>{title}</h2>
      {rows.length === 0 ? (
        empty ? <p className="text-sm" style={dim}>{empty}</p> : null
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <Row key={r.id} r={r} sender={sender} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Row({ r, sender, now }: { r: OutreachRow; sender: string; now: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const first = buildEmail({ name: r.name, videoTitle: r.video_title, topic: r.topic, specific: r.specific, version: r.version, sender });
  const followup = buildFollowup({ name: r.name, sender }, first.subject);
  const dueFollow = needsFollowup(r, now);
  const blocked = r.status === 'no';
  const mail = dueFollow ? followup : first;
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { const x = await fn(); setMsg(x.ok ? null : x.error ?? 'Failed'); });
  const btn = 'px-3 py-1.5 text-xs font-semibold rounded-sm border hover:opacity-80 disabled:opacity-50';

  return (
    <li className="rounded-sm border p-3" style={{ ...bd, background: 'var(--ink-card)' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="font-semibold">{r.name}</span> <span className="text-xs" style={dim}>{r.email}</span>
          {r.channel_url && (
            <a href={r.channel_url} target="_blank" rel="noreferrer" className="text-xs ml-2 underline" style={link}>channel</a>
          )}
        </div>
        <span className="font-mono text-[0.6875rem] uppercase" style={{ color: blocked ? 'var(--developing)' : r.status === 'yes' ? 'var(--possible)' : 'var(--text-on-ink-dim)' }}>
          {blocked ? 'Do not contact' : r.status}
          {r.sent_at ? ` · sent ${new Date(r.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
          {r.followup_sent_at ? ' · followed up' : ''}
        </span>
      </div>

      {r.status === 'draft' && <DraftDetails key={`${r.video_title}|${r.specific}|${r.topic}|${r.version}`} r={r} />}
      {!blocked && ['draft', 'sent'].includes(r.status) && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs" style={link}>{dueFollow ? 'Show follow-up' : 'Show email'}</summary>
          <pre className="whitespace-pre-wrap text-[0.78rem] leading-snug mt-2 p-3 rounded-sm border" style={{ ...bd, color: 'var(--text-body)' }}>{`Subject: ${mail.subject}\n\n${mail.body}`}</pre>
        </details>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {!blocked && (r.status === 'draft' || dueFollow) && (
          <>
            {r.status === 'draft' && !isPersonalised(r) ? (
              <span className="text-xs" style={{ color: 'var(--developing)' }}>Add the video you watched and one thing you liked, then save, to open the email.</span>
            ) : (
              <>
                <a href={gmailComposeUrl(r.email, mail.subject, mail.body)} target="_blank" rel="noreferrer" className={btn} style={{ ...bd, ...link }}>
                  Open in Gmail
                </a>
                <button disabled={pending} onClick={() => run(() => markSent(r.id, dueFollow ? 'followup' : 'first'))} className={btn} style={bd}>
                  I sent it
                </button>
              </>
            )}
          </>
        )}
        {!blocked && r.status !== 'no' && ['sent', 'draft'].includes(r.status) && (
          <>
            <button disabled={pending} onClick={() => run(() => setOutreachStatus(r.id, 'replied'))} className={btn} style={bd}>They replied</button>
            <button disabled={pending} onClick={() => run(() => setOutreachStatus(r.id, 'no'))} className={btn} style={bd}>Said no thanks</button>
          </>
        )}
        {r.status === 'replied' && (
          <>
            <button disabled={pending} onClick={() => run(() => setOutreachStatus(r.id, 'yes'))} className={btn} style={bd}>They said yes</button>
            <button disabled={pending} onClick={() => run(() => setOutreachStatus(r.id, 'no'))} className={btn} style={bd}>Said no thanks</button>
          </>
        )}
        {r.status === 'draft' && (
          <button disabled={pending} onClick={() => run(() => removeDraft(r.id))} className="text-xs underline" style={dim}>Remove</button>
        )}
        {msg && <span className="text-xs" style={{ color: 'var(--developing)' }}>{msg}</span>}
      </div>
      {r.status === 'yes' && (
        <p className="text-xs mt-2" style={dim}>Next: set up chanakyalens.com/?ref={r.name.toLowerCase().replace(/[^a-z0-9]+/g, '')} and a free Lens+ account, and confirm the payout method in writing.</p>
      )}
    </li>
  );
}
