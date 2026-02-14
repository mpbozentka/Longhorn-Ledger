-- View: Per-golfer dashboard aggregates (by user_id).
-- Run in Supabase SQL Editor after the rounds table has fir_count, gir_count, total_putts.
-- Strokes Gained by category (sg_ott, sg_app, etc.) are computed client-side from round_state;
-- this view exposes DB-level averages for score, total SG, and the new FIR/GIR/Putts columns.

create or replace view public.golfer_dashboard_stats as
select
  user_id,
  count(*)::int as round_count,
  avg(total_score) as avg_score,
  avg(total_sg) as avg_total_sg,
  avg(fir_count) as avg_fir_count,
  avg(gir_count) as avg_gir_count,
  avg(total_putts) as avg_total_putts
from public.rounds
group by user_id;
