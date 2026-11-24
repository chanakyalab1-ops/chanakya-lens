-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists business_waitlist (
  email text primary key,
  name text not null,
  company text not null,
  role text not null default '',
  interests text not null default '',
  created_at timestamptz not null default now()
);
alter table business_waitlist enable row level security;
