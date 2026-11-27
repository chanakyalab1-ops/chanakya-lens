import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { OutreachBoard, type OutreachRow } from './OutreachBoard';

export const dynamic = 'force-dynamic';

export default async function CreatorOutreachPage() {
  const { data, error } = await supabaseServer().from('creator_outreach').select('id, name, email, channel_url, video_title, topic, specific, version, status, sent_at, followup_sent_at, created_at').order('created_at', { ascending: false }).limit(500);
  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: 'var(--text-on-ink)' }}>Creator outreach</h1>
        <Link href="/admin" className="font-mono text-[0.68rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>← Admin</Link>
      </div>
      <p className="text-[0.85rem] mb-6" style={{ color: 'var(--text-body)' }}>
        Add a creator, check the email, open it in Gmail and press Send yourself. Nothing here sends email. Use their business email from their About page, mention a video you really watched, and send 10 to 15 a day at most.
      </p>
      {error ? <p className="text-sm" style={{ color: 'var(--developing)' }}>Could not read the list. Has supabase/creator-outreach.sql been run?</p> : <OutreachBoard rows={(data ?? []) as OutreachRow[]} />}
    </div>
  );
}
