'use client';

import { useEffect, useState } from 'react';

const KEY = 'cl_text';
const SIZES = [
  { label: 'Normal', value: '100%' },
  { label: 'Large', value: '112%' },
  { label: 'Larger', value: '125%' },
];

// Reading size for the whole site. Stored on this device and applied before the
// page paints by a small script in the layout.
function applySize(v: string) {
  document.documentElement.style.fontSize = v === '100%' ? '' : v;
}

export function ReadingSize() {
  const [size, setSize] = useState('100%');
  useEffect(() => {
    try {
      setTimeout(() => setSize(window.localStorage.getItem(KEY) ?? '100%'), 0);
    } catch {
      // storage unavailable
    }
  }, []);
  function pick(v: string) {
    setSize(v);
    applySize(v);
    try {
      window.localStorage.setItem(KEY, v);
    } catch {
      // fine without it
    }
  }
  return (
    <div className="flex gap-2">
      {SIZES.map((s) => (
        <button
          key={s.value}
          onClick={() => pick(s.value)}
          aria-pressed={size === s.value}
          className="px-3 py-1.5 text-sm rounded-sm border"
          style={size === s.value ? { background: '#0E7080', color: '#fff', borderColor: '#0E7080' } : { borderColor: 'var(--border)' }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
