'use client';

import { useState } from 'react';

export function ShareButtons({ slug, headline }: { slug: string; headline: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://chanakyalens.com/story/${slug}`;
  const cardUrl = `https://chanakyalens.com/api/story-card/${slug}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(headline + ' ' + url)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(headline)}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>
        Share this story
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={cardUrl} target="_blank" rel="noopener noreferrer" title="Download Instagram Story card" className="inline-flex items-center justify-center w-9 h-9 rounded-sm border hover:opacity-80" style={{ borderColor: 'var(--border)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18" style={{ color: 'var(--text-body)' }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" /></svg>
        </a>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" title="Share on WhatsApp" className="inline-flex items-center justify-center w-9 h-9 rounded-sm border hover:opacity-80" style={{ borderColor: 'var(--border)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ color: 'var(--text-body)' }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.054 23.5l5.803-1.524A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.9 9.9 0 01-5.031-1.375l-.361-.214-3.741.982.999-3.648-.235-.374A9.86 9.86 0 012.1 12C2.1 6.53 6.53 2.1 12 2.1S21.9 6.53 21.9 12 17.47 21.9 12 21.9z" /></svg>
        </a>
        <a href={fbUrl} target="_blank" rel="noopener noreferrer" title="Share on Facebook" className="inline-flex items-center justify-center w-9 h-9 rounded-sm border hover:opacity-80" style={{ borderColor: 'var(--border)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ color: 'var(--text-body)' }}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
        </a>
        <a href={redditUrl} target="_blank" rel="noopener noreferrer" title="Share on Reddit" className="inline-flex items-center justify-center w-9 h-9 rounded-sm border hover:opacity-80" style={{ borderColor: 'var(--border)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ color: 'var(--text-body)' }}><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
        </a>
        {typeof window !== 'undefined' && !!navigator.share && (
          <button onClick={async () => { try { await navigator.share({ title: headline, url }); } catch {} }} title="Share" className="inline-flex items-center justify-center w-9 h-9 rounded-sm border hover:opacity-80" style={{ borderColor: 'var(--border)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color: 'var(--text-body)' }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
          </button>
        )}
        <button onClick={handleCopy} title={copied ? 'Copied!' : 'Copy link'} className="inline-flex items-center justify-center w-9 h-9 rounded-sm border hover:opacity-80" style={{ borderColor: 'var(--border)', color: copied ? 'var(--brand-soft)' : 'var(--text-body)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        </button>
      </div>
    </div>
  );
}