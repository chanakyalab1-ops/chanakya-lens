-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists analysts (
  email text primary key,
  name text not null,
  bio text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists analyst_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  author_email text not null,
  title text not null default '',
  summary text not null default '',
  body text not null default '',
  hero_url text not null default '',
  tags text[] not null default '{}',
  status text not null default 'draft',
  editor_note text not null default '',
  submitted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists analyst_posts_author_idx on analyst_posts (author_email, updated_at desc);
create index if not exists analyst_posts_status_idx on analyst_posts (status, published_at desc);
alter table analysts enable row level security;
alter table analyst_posts enable row level security;

-- Each write-up is about one published story.
alter table analyst_posts add column if not exists story_slug text not null default '';
create index if not exists analyst_posts_story_idx on analyst_posts (story_slug, status);

-- Optionally show a writer's email under her pieces (off by default).
alter table analysts add column if not exists show_email boolean not null default false;
