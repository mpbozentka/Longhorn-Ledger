-- Migration: Add FIR, GIR, and Putts columns to rounds table.
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query).

-- Task 1: Add new columns (NULL allowed; default 0 for new rows so existing rows stay valid)
alter table public.rounds
  add column if not exists fir_count int default 0,
  add column if not exists gir_count int default 0,
  add column if not exists total_putts int default 0;

-- Backfill existing rows: set to 0 where null (add column may leave null on existing rows depending on DB)
update public.rounds
set
  fir_count = coalesce(fir_count, 0),
  gir_count = coalesce(gir_count, 0),
  total_putts = coalesce(total_putts, 0)
where fir_count is null or gir_count is null or total_putts is null;

-- Optional: make columns not null after backfill (uncomment if you want strict non-null)
-- alter table public.rounds alter column fir_count set not null;
-- alter table public.rounds alter column gir_count set not null;
-- alter table public.rounds alter column total_putts set not null;
