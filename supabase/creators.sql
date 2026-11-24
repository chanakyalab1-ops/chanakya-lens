-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists creator_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  channel_url text not null,
  audience text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table creator_applications enable row level security;

-- Referral names (?ref=name) saved with sign-ups.
alter table digest_signups add column if not exists ref text;
alter table lens_plus_waitlist add column if not exists ref text;
