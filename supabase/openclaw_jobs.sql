create extension if not exists pgcrypto;

create table if not exists public.openclaw_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  display_name text,
  prompt text not null,
  response_text text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'error')),
  error_message text,
  source text not null default 'liff',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists openclaw_jobs_user_created_idx
  on public.openclaw_jobs (user_id, created_at);

create index if not exists openclaw_jobs_status_created_idx
  on public.openclaw_jobs (status, created_at);

alter table public.openclaw_jobs enable row level security;
