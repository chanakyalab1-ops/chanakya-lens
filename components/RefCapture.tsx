'use client';

import { useEffect } from 'react';
import { captureRefFromUrl } from '@/lib/referral';

// Remembers a ?ref=name creator link. Renders nothing.
export default function RefCapture() {
  useEffect(() => {
    captureRefFromUrl();
  }, []);
  return null;
}
