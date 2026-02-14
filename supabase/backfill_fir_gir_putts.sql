-- Backfill fir_count, gir_count, total_putts from round_state JSON.
-- Run once in Supabase SQL Editor after adding the columns.
-- Logic matches app: FIR = par 4/5 with 2nd shot from Fairway; GIR = (score - putts) <= par-2; putts = count of Green shots.

UPDATE public.rounds r
SET
  total_putts = COALESCE((
    SELECT sum((SELECT count(*) FROM jsonb_array_elements(h->'shots') s WHERE s->>'lie' = 'Green'))::int
    FROM jsonb_array_elements(r.round_state->'holes') h
  ), 0),
  fir_count = COALESCE((
    SELECT count(*)::int
    FROM jsonb_array_elements(r.round_state->'holes') h
    WHERE (h->>'par')::int IN (4, 5)
      AND jsonb_array_length(h->'shots') >= 2
      AND h->'shots'->1->>'lie' = 'Fairway'
  ), 0),
  gir_count = COALESCE((
    SELECT count(*)::int
    FROM jsonb_array_elements(r.round_state->'holes') h
    WHERE (
      (CASE WHEN (h->>'isCompleted') = 'true' THEN jsonb_array_length(h->'shots') - 1 ELSE jsonb_array_length(h->'shots') END)
      - (SELECT count(*) FROM jsonb_array_elements(h->'shots') s WHERE s->>'lie' = 'Green')
    ) <= (h->>'par')::int - 2
  ), 0)
WHERE r.round_state IS NOT NULL
  AND jsonb_typeof(r.round_state->'holes') = 'array';