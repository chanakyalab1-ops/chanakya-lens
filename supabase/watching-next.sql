-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists story_watching_next (
  slug text primary key,
  items text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table story_watching_next enable row level security;
