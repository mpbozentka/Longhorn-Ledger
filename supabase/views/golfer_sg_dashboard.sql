-- View: Per-user Strokes Gained averages (Section 6).
-- Run in Supabase SQL Editor after migration and backfill (Step 3).

CREATE OR REPLACE VIEW public.golfer_sg_dashboard AS
SELECT
  user_id,
  count(*)::int AS rounds_played,
  round(avg(sg_ott)::numeric, 2) AS avg_sg_ott,
  round(avg(sg_app)::numeric, 2) AS avg_sg_app,
  round(avg(sg_arg)::numeric, 2) AS avg_sg_arg,
  round(avg(sg_putt)::numeric, 2) AS avg_sg_putt
FROM public.rounds
WHERE sg_ott IS NOT NULL
GROUP BY user_id;
