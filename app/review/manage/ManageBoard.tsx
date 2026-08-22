'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  unpublishStory,
  updatePublishedStory,
  type Confidence,
  type ImpactNode,
  type StatusTag,
} from '../actions';

type PublishedStory = {
  slug: string;
  headline: string;
  dek: string | null;
  body: string | null;
  category: string | null;
  status: 'developing' | 'settled' | null;
  read_time: string | null;
  has_video: boolean | null;
  impact_nodes: ImpactNode[] | null;
  chanakya_analysis: string | null;
  off_lens: string | null;
  created_at: string;
};

const CATEGORIES = [
  'Trade & Tariffs',
  'Political',
  'Resources',
  'Tech & Regulation',
  'Security & Conflict',
];

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  direct: 'Direct',
  likely: 'Likely',
  possible: 'Possible',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ManageBoard({ stories }: { stories: PublishedStory[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<PublishedStory | null>(null);
  const [confirmingUnpublish, setConfirmingUnpublish] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleUnpublish(slug: string) {
    setError(null);
    startTransition(async () => {
      try {
        await unpublishStory(slug);
        setConfirmingUnpublish(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to unpublish.');
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#EDE7DA]">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0B1220]/95 backdrop-blur z-10">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Manage published stories</h1>
          <p className="font-mono text-xs text-[#8A93A6] mt-1">{stories.length} live</p>
        </div>
        <Link href="/review" className="text-sm px-3 py-1.5 rounded border border-white/15 hover:bg-white/5">
          Back to review queue
        </Link>
      </header>

      {error && (
        <div className="mx-6 mt-4 px-4 py-2 rounded border border-red-400/30 bg-red-400/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      <main className="px-6 py-6 space-y-2">
        {stories.map((s) => (
          <div key={s.slug} className="border border-white/10 rounded px-4 py-3 bg-white/[0.02]">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-serif text-lg truncate">{s.headline}</div>
                <div className="font-mono text-xs text-[#8A93A6] mt-1">
                  {s.category && `${s.category} · `}
                  {s.status === 'developing' && 'Developing · '}
                  {s.status === 'settled' && 'Settled · '}
                  published {formatDate(s.created_at)}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/story/${s.slug}`}
                  target="_blank"
                  className="text-sm px-3 py-1.5 rounded border border-white/15 hover:bg-white/5"
                >
                  View
                </Link>
                <button
                  onClick={() => setEditing(s)}
                  disabled={isPending}
                  className="text-sm px-3 py-1.5 rounded border border-white/15 hover:bg-white/5 disabled:opacity-40"
                >
                  Edit
                </button>
                {confirmingUnpublish === s.slug ? (
                  <>
                    <button
                      onClick={() => handleUnpublish(s.slug)}
                      disabled={isPending}
                      className="text-sm px-3 py-1.5 rounded bg-red-500/80 text-white font-medium hover:bg-red-500 disabled:opacity-40"
                    >
                      {isPending ? 'Removing…' : 'Confirm unpublish'}
                    </button>
                    <button
                      onClick={() => setConfirmingUnpublish(null)}
                      className="text-sm px-3 py-1.5 rounded border border-white/15 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmingUnpublish(s.slug)}
                    disabled={isPending}
                    className="text-sm px-3 py-1.5 rounded border border-red-400/30 text-red-300 hover:bg-red-400/10 disabled:opacity-40"
                  >
                    Unpublish
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {stories.length === 0 && (
          <p className="font-mono text-xs text-[#8A93A6]">Nothing published yet.</p>
        )}
      </main>

      {editing && (
        <EditPublishedModal
          story={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EditPublishedModal({
  story,
  onClose,
  onSaved,
}: {
  story: PublishedStory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [headline, setHeadline] = useState(story.headline);
  const [dek, setDek] = useState(story.dek ?? '');
  const [body, setBody] = useState(story.body ?? '');
  const [category, setCategory] = useState(story.category ?? CATEGORIES[0]);
  const [readTime, setReadTime] = useState(story.read_time ?? '');
  const [hasVideo, setHasVideo] = useState(story.has_video ?? false);
  const [statusTag, setStatusTag] = useState<StatusTag>(story.status);
  const [impactNodes, setImpactNodes] = useState<ImpactNode[]>(story.impact_nodes ?? []);
  const [chanakyaAnalysis, setChanakyaAnalysis] = useState(story.chanakya_analysis ?? '');
  const [offLens, setOffLens] = useState(story.off_lens ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateNode(i: number, patch: Partial<ImpactNode>) {
    setImpactNodes((n) => n.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeNode(i: number) {
    setImpactNodes((n) => n.filter((_, idx) => idx !== i));
  }
  function addNode() {
    setImpactNodes((n) => [...n, { audience: '', mechanism: '', confidence: 'likely' }]);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await updatePublishedStory(story.slug, {
        headline,
        dek,
        body,
        category,
        readTime,
        hasVideo,
        statusTag,
        impactNodes: impactNodes.filter((n) => n.audience.trim() && n.mechanism.trim()),
        chanakyaAnalysis,
        offLens,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-end z-20">
      <div className="w-full max-w-2xl h-full bg-[#0F1826] border-l border-white/10 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Edit published story</h2>
          <button onClick={onClose} className="text-[#8A93A6] hover:text-[#EDE7DA]">
            X
          </button>
        </div>

        {error && (
          <div className="px-4 py-2 rounded border border-red-400/30 bg-red-400/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">Headline</label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 font-serif text-lg"
          />
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">Dek</label>
          <input
            value={dek}
            onChange={(e) => setDek(e.target.value)}
            className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">Read time</label>
            <input
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hasVideo} onChange={(e) => setHasVideo(e.target.checked)} />
          Has video embed
        </label>

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">Status tag</label>
          <div className="mt-1 flex gap-2">
            {([[null, 'None'], ['developing', 'Developing'], ['settled', 'Settled']] as [StatusTag, string][]).map(
              ([value, label]) => (
                <button
                  key={label}
                  onClick={() => setStatusTag(value)}
                  className={`text-sm px-3 py-1.5 rounded border ${
                    statusTag === value ? 'border-[#C97B4A] bg-[#C97B4A]/10' : 'border-white/15 hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
              How Could This Affect You
            </label>
            <button onClick={addNode} className="font-mono text-xs text-[#C97B4A] hover:underline">
              + add
            </button>
          </div>
          <div className="mt-2 space-y-3">
            {impactNodes.map((n, i) => (
              <div key={i} className="border border-white/10 rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={n.confidence}
                    onChange={(e) => updateNode(i, { confidence: e.target.value as Confidence })}
                    className="bg-white/[0.03] border border-white/10 rounded text-xs px-2 py-1"
                  >
                    {(Object.keys(CONFIDENCE_LABEL) as Confidence[]).map((c) => (
                      <option key={c} value={c}>{CONFIDENCE_LABEL[c]}</option>
                    ))}
                  </select>
                  <button onClick={() => removeNode(i)} className="ml-auto text-[#8A93A6] hover:text-red-300 text-xs">
                    remove
                  </button>
                </div>
                <input
                  value={n.audience}
                  onChange={(e) => updateNode(i, { audience: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
                  placeholder="If you... (audience)"
                />
                <textarea
                  value={n.mechanism}
                  onChange={(e) => updateNode(i, { mechanism: e.target.value })}
                  rows={2}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
                  placeholder="Mechanism"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">Chanakya&apos;s Move</label>
          <textarea
            value={chanakyaAnalysis}
            onChange={(e) => setChanakyaAnalysis(e.target.value)}
            rows={4}
            className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded border border-white/15 hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !headline.trim() || !body.trim()}
            className="text-sm px-4 py-2 rounded bg-[#C97B4A] text-[#0B1220] font-medium hover:bg-[#D98857] disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}