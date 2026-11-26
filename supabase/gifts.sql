-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists gift_codes (
  code text primary key,
  paddle_transaction_id text not null unique,
  buyer_email text not null default '',
  months int not null default 12,
  created_at timestamptz not null default now(),
  redeemed_by uuid,
  redeemed_at timestamptz
);
create table if not exists group_plan_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organisation text not null default '',
  seats text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table gift_codes enable row level security;
alter table group_plan_requests enable row level security;
