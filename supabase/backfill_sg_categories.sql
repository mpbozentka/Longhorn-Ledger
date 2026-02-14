-- Backfill sg_ott, sg_app, sg_arg, sg_putt from round_state (Section 5 logic).
-- Run in Supabase SQL Editor after adding the columns (Step 2).
-- Uses: OTT = Tee on Par 4/5; PUTT = Green; ARG = ≤30 yd non-Green; APP = Fairway/Rough >30 yd, else APP.
-- startDistance -1 or null treated as unknown (excluded from ARG; included in APP/OTT/PUTT by lie only).
-- startDistance cast to numeric to support decimal values in JSON.

WITH shot_expanded AS (
  SELECT
    r.id AS round_id,
    (h->>'par')::int AS par,
    shot.elem AS shot
  FROM public.rounds r,
       jsonb_array_elements(r.round_state->'holes') h,
       jsonb_array_elements(h->'shots') AS shot(elem)
  WHERE r.round_state IS NOT NULL
    AND jsonb_typeof(r.round_state->'holes') = 'array'
),
categorized AS (
  SELECT
    round_id,
    (shot->>'strokesGained')::numeric AS sg,
    CASE
      WHEN shot->>'lie' = 'Tee' AND par IN (4, 5) THEN 'OTT'
      WHEN shot->>'lie' = 'Green' THEN 'PUTT'
      WHEN (COALESCE((shot->>'startDistance')::numeric, -1)) <= 30 AND (COALESCE((shot->>'startDistance')::numeric, -1)) >= 0 AND shot->>'lie' != 'Green' THEN 'ARG'
      WHEN shot->>'lie' IN ('Fairway', 'Rough') AND (shot->>'startDistance')::numeric > 30 THEN 'APP'
      WHEN shot->>'lie' = 'Sand' THEN 'ARG'
      ELSE 'APP'
    END AS cat
  FROM shot_expanded
  WHERE (shot->>'strokesGained') IS NOT NULL
),
totals AS (
  SELECT
    round_id,
    sum(sg) FILTER (WHERE cat = 'OTT') AS sg_ott,
    sum(sg) FILTER (WHERE cat = 'APP') AS sg_app,
    sum(sg) FILTER (WHERE cat = 'ARG') AS sg_arg,
    sum(sg) FILTER (WHERE cat = 'PUTT') AS sg_putt
  FROM categorized
  GROUP BY round_id
)
UPDATE public.rounds r
SET
  sg_ott = t.sg_ott,
  sg_app = t.sg_app,
  sg_arg = t.sg_arg,
  sg_putt = t.sg_putt
FROM totals t
WHERE r.id = t.round_id;
