'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ClusterSuggestion } from '@/lib/clustering';
import {
  createDraft,
  dismissCandidates,
  publishDraft,
  rejectDraft,
  type ArticleRole,
  type Confidence,
  type ImpactNode,
  type StatusTag,
} from './actions';

type Candidate = {
  id: string;
  url: string;
  title: string;
  source_country: string | null;
  domain: string;
  seen_date: string;
  tone: number | null;
  query_tag: string | null;
};

type Draft = {
  slug: string;
  headline: string;
  status: 'developing' | 'settled' | null;
  category: string | null;
  workflow_status: string;
  created_at: string;
  updated_at: string;
  articles: { candidate_id: string; role: ArticleRole }[];
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  direct: '🟠 Direct',
  likely: '🟡 Likely',
  possible: '🟢 Possible',
};

const ROLE_LABEL: Record<ArticleRole, string> = {
  primary: 'Primary',
  local: 'Local coverage',
  international: 'International coverage',
  source: 'Additional source',
};

const CATEGORIES = [
  'Trade & Tariffs',
  'Political',
  'Resources',
  'Tech & Regulation',
  'Security & Conflict',
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ReviewBoard({
  candidates,
  suggestions,
  drafts,
}: {
  candidates: Candidate[];
  suggestions: ClusterSuggestion[];
  drafts: Draft[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidateById = useMemo(
    () => new Map(candidates.map((c) => [c.id, c])),
    [candidates],
  );

  const clusteredIds = useMemo(
    () => new Set(suggestions.flatMap((s) => s.candidateIds)),
    [suggestions],
  );
  const singles = candidates.filter((c) => !clusteredIds.has(c.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectGroup(ids: string[]) {
    setSelected(new Set(ids));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleDismiss(ids: string[]) {
    setError(null);
    startTransition(async () => {
      try {
        await dismissCandidates(ids);
        ids.forEach((id) => selected.delete(id));
        setSelected(new Set(selected));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to dismiss.');
      }
    });
  }

  function handlePublish(slug: string) {
    setError(null);
    startTransition(async () => {
      try {
        await publishDraft(slug);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to publish.');
      }
    });
  }

  function handleReject(slug: string) {
    setError(null);
    startTransition(async () => {
      try {
        await rejectDraft(slug);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to reject.');
      }
    });
  }

  const selectedCandidates = [...selected]
    .map((id) => candidateById.get(id))
    .filter((c): c is Candidate => Boolean(c));

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#EDE7DA]">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0B1220]/95 backdrop-blur z-10">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Review queue</h1>
          <p className="font-mono text-xs text-[#8A93A6] mt-1">
            {candidates.length} pending · {suggestions.length} suggested groups ·{' '}
            {drafts.length} drafts in review
          </p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#8A93A6]">
              {selected.size} selected
            </span>
            <button
              onClick={() => handleDismiss([...selected])}
              disabled={isPending}
              className="text-sm px-3 py-1.5 rounded border border-white/15 hover:bg-white/5 disabled:opacity-40"
            >
              Dismiss
            </button>
            <button
              onClick={() => setEditorOpen(true)}
              disabled={isPending}
              className="text-sm px-3 py-1.5 rounded bg-[#C97B4A] text-[#0B1220] font-medium hover:bg-[#D98857] disabled:opacity-40"
            >
              Build story from {selected.size}
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-[#8A93A6] hover:text-[#EDE7DA]"
            >
              Clear
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="mx-6 mt-4 px-4 py-2 rounded border border-red-400/30 bg-red-400/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      <main className="px-6 py-6 space-y-8">
        {drafts.length > 0 && (
          <section>
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#8A93A6] mb-3">
              Drafts in review
            </h2>
            <div className="space-y-2">
              {drafts.map((d) => (
                <div
                  key={d.slug}
                  className="flex items-center justify-between border border-white/10 rounded px-4 py-3 bg-white/[0.02]"
                >
                  <div>
                    <div className="font-serif text-lg">{d.headline}</div>
                    <div className="font-mono text-xs text-[#8A93A6] mt-1">
                      {d.category && `${d.category} · `}
                      {d.status === 'developing' && '🔴 Developing · '}
                      {d.status === 'settled' && '⚪ Settled · '}
                      {d.articles.length} source{d.articles.length === 1 ? '' : 's'} ·
                      updated {formatDate(d.updated_at)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(d.slug)}
                      disabled={isPending}
                      className="text-sm px-3 py-1.5 rounded border border-white/15 hover:bg-white/5 disabled:opacity-40"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handlePublish(d.slug)}
                      disabled={isPending}
                      className="text-sm px-3 py-1.5 rounded bg-[#6FA98A] text-[#0B1220] font-medium hover:bg-[#7EB899] disabled:opacity-40"
                    >
                      Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {suggestions.length > 0 && (
          <section>
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#8A93A6] mb-3">
              Suggested groups
            </h2>
            <div className="space-y-3">
              {suggestions.map((group) => (
                <div
                  key={group.key}
                  className="border border-white/10 rounded px-4 py-3 bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-[#8A93A6]">
                      {group.candidateIds.length} related articles
                    </span>
                    <button
                      onClick={() => selectGroup(group.candidateIds)}
                      className="font-mono text-xs text-[#C97B4A] hover:underline"
                    >
                      select all
                    </button>
                  </div>
                  <div className="space-y-1">
                    {group.candidateIds.map((id) => {
                      const c = candidateById.get(id);
                      if (!c) return null;
                      return (
                        <CandidateRow
                          key={id}
                          candidate={c}
                          checked={selected.has(id)}
                          onToggle={() => toggle(id)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-mono text-xs uppercase tracking-wider text-[#8A93A6] mb-3">
            Ungrouped
          </h2>
          <div className="space-y-1">
            {singles.map((c) => (
              <CandidateRow
                key={c.id}
                candidate={c}
                checked={selected.has(c.id)}
                onToggle={() => toggle(c.id)}
                showDismiss
                onDismiss={() => handleDismiss([c.id])}
              />
            ))}
            {singles.length === 0 && (
              <p className="font-mono text-xs text-[#8A93A6]">
                Nothing ungrouped right now.
              </p>
            )}
          </div>
        </section>
      </main>

      {editorOpen && (
        <StoryEditor
          candidates={selectedCandidates}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            clearSelection();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CandidateRow({
  candidate,
  checked,
  onToggle,
  showDismiss,
  onDismiss,
}: {
  candidate: Candidate;
  checked: boolean;
  onToggle: () => void;
  showDismiss?: boolean;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/[0.03]">
      <input type="checkbox" checked={checked} onChange={onToggle} className="shrink-0" />
      <a
        href={candidate.url}
        target="_blank"
        rel="noreferrer"
        className="flex-1 text-sm truncate hover:underline"
        title={candidate.title}
      >
        {candidate.title}
      </a>
      <span className="font-mono text-xs text-[#8A93A6] shrink-0">
        {candidate.source_country ?? candidate.domain}
      </span>
      <span className="font-mono text-xs text-[#8A93A6] shrink-0 w-32 text-right">
        {formatDate(candidate.seen_date)}
      </span>
      {showDismiss && (
        <button
          onClick={onDismiss}
          className="font-mono text-xs text-[#8A93A6] hover:text-red-300 shrink-0"
        >
          dismiss
        </button>
      )}
    </div>
  );
}

function StoryEditor({
  candidates,
  onClose,
  onSaved,
}: {
  candidates: Candidate[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [headline, setHeadline] = useState('');
  const [dek, setDek] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [readTime, setReadTime] = useState('');
  const [hasVideo, setHasVideo] = useState(false);
  const [statusTag, setStatusTag] = useState<StatusTag>(null);
  const [roles, setRoles] = useState<Record<string, ArticleRole>>(() =>
    Object.fromEntries(
      candidates.map((c, i) => [c.id, i === 0 ? 'primary' : 'source']),
    ),
  );
  const [impactNodes, setImpactNodes] = useState<ImpactNode[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addNode() {
    setImpactNodes((n) => [...n, { audience: '', mechanism: '', confidence: 'likely' }]);
  }
  function updateNode(i: number, patch: Partial<ImpactNode>) {
    setImpactNodes((n) => n.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeNode(i: number) {
    setImpactNodes((n) => n.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await createDraft({
        headline,
        dek,
        body,
        category,
        readTime,
        hasVideo,
        statusTag,
        articles: candidates.map((c) => ({
          candidateId: c.id,
          role: roles[c.id] ?? 'source',
        })),
        impactNodes: impactNodes.filter(
          (n) => n.audience.trim().length > 0 && n.mechanism.trim().length > 0,
        ),
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-end z-20">
      <div className="w-full max-w-2xl h-full bg-[#0F1826] border-l border-white/10 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">New story draft</h2>
          <button onClick={onClose} className="text-[#8A93A6] hover:text-[#EDE7DA]">
            ✕
          </button>
        </div>

        {error && (
          <div className="px-4 py-2 rounded border border-red-400/30 bg-red-400/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
            Headline
          </label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 font-serif text-lg"
            placeholder="Story headline"
          />
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
            Dek
          </label>
          <input
            value={dek}
            onChange={(e) => setDek(e.target.value)}
            className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
            placeholder="One-line subhead"
          />
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
            Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
            placeholder="Factual brief — what happened"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
              Read time
            </label>
            <input
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
              placeholder="4 min"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hasVideo}
            onChange={(e) => setHasVideo(e.target.checked)}
          />
          Has video embed
        </label>

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
            Status tag (optional — only when unsettled-ness matters)
          </label>
          <div className="mt-1 flex gap-2">
            {(
              [
                [null, 'None'],
                ['developing', '🔴 Developing'],
                ['settled', '⚪ Settled'],
              ] as [StatusTag, string][]
            ).map(([value, label]) => (
              <button
                key={label}
                onClick={() => setStatusTag(value)}
                className={`text-sm px-3 py-1.5 rounded border ${
                  statusTag === value
                    ? 'border-[#C97B4A] bg-[#C97B4A]/10'
                    : 'border-white/15 hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
            Source articles ({candidates.length})
          </label>
          <div className="mt-2 space-y-2">
            {candidates.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 border border-white/10 rounded px-3 py-2"
              >
                <span className="flex-1 text-sm truncate" title={c.title}>
                  {c.title}
                </span>
                <span className="font-mono text-xs text-[#8A93A6] shrink-0">
                  {c.source_country ?? c.domain}
                </span>
                <select
                  value={roles[c.id]}
                  onChange={(e) =>
                    setRoles((r) => ({ ...r, [c.id]: e.target.value as ArticleRole }))
                  }
                  className="bg-white/[0.03] border border-white/10 rounded text-xs px-2 py-1"
                >
                  {(Object.keys(ROLE_LABEL) as ArticleRole[]).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
              How Could This Affect You (optional — skip if it doesn't earn a place)
            </label>
            <button
              onClick={addNode}
              className="font-mono text-xs text-[#C97B4A] hover:underline"
            >
              + add
            </button>
          </div>
          <div className="mt-2 space-y-3">
            {impactNodes.map((n, i) => (
              <div key={i} className="border border-white/10 rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={n.confidence}
                    onChange={(e) =>
                      updateNode(i, { confidence: e.target.value as Confidence })
                    }
                    className="bg-white/[0.03] border border-white/10 rounded text-xs px-2 py-1"
                  >
                    {(Object.keys(CONFIDENCE_LABEL) as Confidence[]).map((c) => (
                      <option key={c} value={c}>
                        {CONFIDENCE_LABEL[c]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeNode(i)}
                    className="ml-auto text-[#8A93A6] hover:text-red-300 text-xs"
                  >
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
                  placeholder="Mechanism — how this actually affects them"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded border border-white/15 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !headline.trim() || !body.trim()}
            className="text-sm px-4 py-2 rounded bg-[#C97B4A] text-[#0B1220] font-medium hover:bg-[#D98857] disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
        </div>
      </div>
    </div>
  );
}