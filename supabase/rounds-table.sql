-- Run this in the Supabase SQL Editor to create the rounds table.
-- Dashboard → SQL Editor → New query → paste and Run.

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  total_score int not null,
  total_sg numeric not null,
  round_state jsonb not null,
  created_at timestamptz not null default now()
);

-- Index for fast listing by user (dashboard loads "my rounds")
create index if not exists rounds_user_id_created_at_idx
  on public.rounds (user_id, created_at desc);

-- Optional: restrict table so only the backend (service role) can read/write.
-- Your app uses the service role in API routes, so RLS is not required,
-- but you can enable it and add policies if you later use the anon key client-side.
-- alter table public.rounds enable row level security;
-- create policy "Users can only read own rounds"
--   on public.rounds for select
--   using (auth.jwt() ->> 'sub' = user_id);
-- create policy "Users can only insert own rounds"
--   on public.rounds for insert
--   with check (auth.jwt() ->> 'sub' = user_id);
