-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists lens_plus_waitlist (
  email text primary key,
  source text not null default '',
  created_at timestamptz not null default now()
);
alter table lens_plus_waitlist enable row level security;
