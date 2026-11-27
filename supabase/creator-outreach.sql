-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists creator_outreach (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  channel_url text not null default '',
  video_title text not null default '',
  topic text not null default '',
  specific text not null default '',
  version text not null default 'geo',
  status text not null default 'draft',
  sent_at timestamptz,
  followup_sent_at timestamptz,
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table creator_outreach enable row level security;
