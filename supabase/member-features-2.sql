-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists story_updates (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  note text not null,
  created_at timestamptz not null default now()
);
create index if not exists story_updates_slug_idx on story_updates (slug, created_at desc);

create table if not exists story_watches (
  user_id uuid not null,
  slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, slug)
);

create table if not exists ask_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists ask_log_user_idx on ask_log (user_id, created_at desc);

alter table push_subscriptions add column if not exists user_id uuid;

alter table story_updates enable row level security;
alter table story_watches enable row level security;
alter table ask_log enable row level security;
