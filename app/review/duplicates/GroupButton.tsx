'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { groupAsUpdate } from '../actions';

// Files the newer story under the older one as a follow-up, so readers see one
// story with a timeline instead of two near-identical ones.
export function GroupButton({ newerSlug, olderSlug }: { newerSlug: string; olderSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setNote(null);
    const res = await groupAsUpdate(newerSlug, olderSlug);
    if (res.ok) router.refresh();
    else setNote(res.error);
    setBusy(false);
  }

  return (
    <div className="mt-2">
      <button onClick={go} disabled={busy} className="text-[0.75rem] underline disabled:opacity-50" style={{ color: 'var(--brand-soft)' }}>
        {busy ? 'Grouping…' : 'Group as one story (newer becomes an update)'}
      </button>
      {note && <span className="ml-2 text-[0.75rem]" style={{ color: 'var(--developing)' }}>{note}</span>}
    </div>
  );
}
