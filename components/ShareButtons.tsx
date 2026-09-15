'use client';

import { useState } from 'react';

export function ShareButtons({ slug, headline }: { slug: string; headline: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://chanakyalens.com/story/${slug}`;
  const cardUrl = `https://chanakyalens.com/api/story-card/${slug}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(headline + ' ' + url)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(headline)}`;

  async function handleNativeShare() {
    try { await navigator.share({ title: headline, url }); } catch {}
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="font-mono text-[0.68rem] uppercase tracking-wide"
        style={{ color: 'var(--text-on-ink-dim)' }}
      >
        Share this story
      </div>
      <div className="flex flex-wrap gap-2">
        
          href={cardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 rounded-sm border text-[0.78rem] font-mono hover:opacity-80"
          style={{ borderColor: 'var(--border)', color: 'var(--text-body)' }}
        >
          Story card
        </a>
        
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 rounded-sm border text-[0.78rem] font-mono hover:opacity-80"
          style={{ borderColor: 'var(--border)', color: 'var(--text-body)' }}
        >
          WhatsApp
        </a>
        
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 rounded-sm border text-[0.78rem] font-mono hover:opacity-80"
          style={{ borderColor: 'var(--border)', color: 'var(--text-body)' }}
        >
          Facebook
        </a>
        
          href={redditUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 rounded-sm border text-[0.78rem] font-mono hover:opacity-80"
          style={{ borderColor: 'var(--border)', color: 'var(--text-body)' }}
        >
          Reddit
        </a>
        {typeof window !== 'undefined' && !!navigator.share && (
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center px-3 py-1.5 rounded-sm border text-[0.78rem] font-mono hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-body)' }}
          >
            Share
          </button>
        )}
        <button
          onClick={handleCopy}
          className="inline-flex items-center px-3 py-1.5 rounded-sm border text-[0.78rem] font-mono hover:opacity-80"
          style={{ borderColor: 'var(--border)', color: copied ? 'var(--brand-soft)' : 'var(--text-body)' }}
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}