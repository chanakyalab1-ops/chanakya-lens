'use client';

import { useEffect, useState } from 'react';

// Whether this reader may use the member tools (Lens+ members, and the owner while
// testing). Anonymous visitors skip the request. `null` until known.
export function useLensPlus(): boolean | null {
  const [member, setMember] = useState<boolean | null>(null);
  useEffect(() => {
    let off = false;
    if (!/(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) {
      setTimeout(() => !off && setMember(false), 0);
      return;
    }
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { enabled?: boolean; paid?: string }) => !off && setMember(!!d.enabled && d.paid === 'allowed'))
      .catch(() => !off && setMember(false));
    return () => {
      off = true;
    };
  }, []);
  return member;
}
