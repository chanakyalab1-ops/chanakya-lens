import { supabaseServer } from '@/lib/supabase-server';
import { ManageBoard } from './ManageBoard';

export const dynamic = 'force-dynamic';

export default async function ManagePage() {
  const supabase = supabaseServer();

  const { data: stories, error } = await supabase
    .from('stories')
    .select('slug, headline, dek, body, category, status, read_time, has_video, impact_nodes, chanakya_analysis, off_lens, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-[#EDE7DA] p-6">
        <p className="text-red-300 text-sm">Failed to load stories: {error.message}</p>
      </div>
    );
  }

  return <ManageBoard stories={stories ?? []} />;
}