-- Migration: Add per-round Strokes Gained by category (OTT, APP, ARG, PUTT).
-- Run in Supabase SQL Editor (Step 1 before backfill and view).

ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS sg_ott numeric,
  ADD COLUMN IF NOT EXISTS sg_app numeric,
  ADD COLUMN IF NOT EXISTS sg_arg numeric,
  ADD COLUMN IF NOT EXISTS sg_putt numeric;

-- Optional: backfill will set values; leave nullable so existing rows are valid until backfill runs.
