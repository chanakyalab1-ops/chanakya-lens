import type { Block, Inline } from '@/lib/miniMarkdown';

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((it, i) =>
        it.t === 'b' ? <strong key={i}>{it.v}</strong> : it.t === 'i' ? <em key={i}>{it.v}</em> : it.t === 'a' ? (
          <a key={i} href={it.href} target="_blank" rel="noreferrer noopener" className="underline" style={{ color: 'var(--brand-soft)' }}>{it.v}</a>
        ) : (
          <span key={i}>{it.v}</span>
        ),
      )}
    </>
  );
}

// Renders parsed Dispatch blocks. Nothing is injected as raw HTML.
export function DispatchBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => {
        if (b.t === 'h2') return <h2 key={i} className="font-display font-bold text-2xl mt-8" style={{ color: 'var(--brand-soft)' }}>{b.v}</h2>;
        if (b.t === 'h3') return <h3 key={i} className="font-display font-bold text-xl mt-6">{b.v}</h3>;
        if (b.t === 'ul') return (
          <ul key={i} className="list-disc pl-6 space-y-1.5 text-[1.02rem] leading-relaxed" style={{ color: 'var(--text-body)' }}>
            {b.v.map((li, j) => <li key={j}><Inlines items={li} /></li>)}
          </ul>
        );
        if (b.t === 'quote') return (
          <blockquote key={i} className="border-l-4 pl-4 italic text-[1.02rem] leading-relaxed" style={{ borderColor: 'var(--brand-soft)', color: 'var(--text-body)' }}><Inlines items={b.v} /></blockquote>
        );
        if (b.t === 'img') return (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={b.src} alt={b.alt} loading="lazy" className="w-full rounded-sm border" style={{ borderColor: 'var(--border)' }} />
        );
        return <p key={i} className="text-[1.02rem] leading-relaxed" style={{ color: 'var(--text-body)' }}><Inlines items={b.v} /></p>;
      })}
    </div>
  );
}
