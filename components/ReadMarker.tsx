'use client';

import { useEffect } from 'react';

const KEY = 'cl_read';
const MAX = 600;

export function getLocalReads(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

// Remembers on this device that a story was opened (for "Fresh only"), and, for
// a signed-in reader, records it for their Reading Map. Story pages are cached
// for everyone, so this runs in the browser.
export function ReadMarker({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const reads = getLocalReads().filter((s) => s !== slug);
      reads.push(slug);
      window.localStorage.setItem(KEY, JSON.stringify(reads.slice(-MAX)));
    } catch {
      // storage unavailable; fine
    }
    if (/(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) {
      fetch('/api/reads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) }).catch(() => {});
    }
  }, [slug]);
  return null;
}
