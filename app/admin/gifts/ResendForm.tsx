'use client';

import { useState, useTransition } from 'react';
import { resendGift } from './actions';

export function ResendForm({ code, defaultEmail }: { code: string; defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="send to…" className="rounded border border-white/15 bg-transparent px-2 py-1 text-xs w-48" />
      <button
        disabled={pending || !email.trim()}
        onClick={() => start(async () => { const r = await resendGift(code, email); setMsg(r.ok ? 'Sent' : r.error ?? 'Failed'); })}
        className="text-xs underline disabled:opacity-40"
      >
        {pending ? 'Sending…' : 'Send code'}
      </button>
      {msg && <span className="text-xs text-[#8A93A6]">{msg}</span>}
    </span>
  );
}
