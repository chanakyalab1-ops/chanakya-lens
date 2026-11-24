-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists watchlist_items (
  user_id uuid not null,
  kind text not null check (kind in ('category','lens')),
  slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, slug)
);
create table if not exists story_reads (
  user_id uuid not null,
  slug text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, slug)
);
alter table watchlist_items enable row level security;
alter table story_reads enable row level security;
