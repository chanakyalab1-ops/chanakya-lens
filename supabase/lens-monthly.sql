-- Run once in the Supabase SQL editor. Safe to re-run.
-- (The "dispatches" table was created earlier; Lens Monthly is its new name for readers.)
create table if not exists dispatches (
  slug text primary key,
  title text not null,
  summary text not null default '',
  body text not null default '',
  hero_url text not null default '',
  theme text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table dispatches add column if not exists period text;
alter table dispatches enable row level security;
