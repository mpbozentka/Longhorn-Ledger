# Strokes Gained Data Aggregation — SQL Prompt & Spec

Use this as the single source of truth for aggregating Strokes Gained (OTT, APP, ARG, PUTT) in **Longhorn Ledger**. Shot-level SG is computed as:  
**SG = (Baseline Strokes Start) − (Baseline Strokes End) − 1**.

---

## 1. Category Definitions (shot-level)

Classify each shot in `round_state.holes[].shots[]` using `lie`, `startDistance` (yards), and hole `par`:

| Category | Rule | Round Summary | Dashboard |
|----------|------|----------------|-----------|
| **OTT** (Off-the-Tee) | `lie = 'Tee'` **and** `par IN (4, 5)` (exclude Par 3 tee shots) | Sum(SG) for these shots | Avg per round (all-time or filtered) |
| **APP** (Approach) | Shots intended to hit the green from **> 30 yards**: `lie IN ('Fairway','Rough')` and `startDistance > 30` (or not Green/Tee and distance > 30) | Sum(SG) for these shots | Avg per round |
| **ARG** (Around-the-Green) | Shots **within 30 yards** of the edge of the green, **excluding putts**: `startDistance <= 30` and `lie != 'Green'` (e.g. Sand, Rough, Fairway) | Sum(SG) for these shots | Avg per round |
| **PUTT** (Putting) | All shots from the putting surface: `lie = 'Green'` | Sum(SG) for these shots | Avg per round |

**Edge cases:**  
- Treat missing `startDistance` (e.g. sentinel `-1` or null) per your app rules (e.g. exclude from APP/ARG, or use hole yardage for tee).  
- Par 3 tee shots are often counted as **APP** in many systems; if you prefer that, use: OTT = Tee on Par 4/5 only, APP = Tee on Par 3 + Fairway/Rough from > 30 yards.

---

## 2. Round Summary (single round)

- **OTT:** `Sum(shot.strokesGained)` for shots where `lie = 'Tee'` and hole `par IN (4,5)`.
- **APP:** `Sum(shot.strokesGained)` for shots where approach definition above holds (e.g. `lie IN ('Fairway','Rough')` and `startDistance > 30`).
- **ARG:** `Sum(shot.strokesGained)` for shots where `startDistance <= 30` and `lie != 'Green'`.
- **PUTT:** `Sum(shot.strokesGained)` for shots where `lie = 'Green'`.

**Display:** One value per category, e.g. `"+1.2"`, `"-0.5"`, etc.

---

## 3. Dashboard (multi-round averages)

- **Per-round average:**  
  `Total_SG_<CAT>_All_Time / Total_Rounds_Played`  
  where `Total_SG_<CAT>_All_Time` = sum of that category’s round total across all (filtered) rounds, and `Total_Rounds_Played` = count of rounds (optionally only complete rounds, e.g. 18 holes).
- **Display:** e.g. `"-0.5 Avg per round"` for APP; same pattern for OTT, ARG, PUTT.
- **Goal (OTT):** Show whether the player is consistently gaining or losing strokes with the driver (Par 4/5 tee shots).

---

## 4. SQL Implementation Notes

- **Source of truth:** Shot-level `strokesGained` and classification fields live in `round_state` (JSONB) per round. Optionally store **per-round totals** `sg_ott`, `sg_app`, `sg_arg`, `sg_putt` on `rounds` for fast dashboard queries.
- **Rounding:** Use 1 decimal place for display (e.g. `ROUND(..., 1)`).
- **Filtering:** Dashboard may restrict to “complete” rounds only (e.g. 18 holes completed) and/or to a date range or last N rounds; apply the same filter when summing SG and counting rounds.

---

## 5. Example SQL: Per-round totals from `round_state`

Use this pattern to compute **per-round** OTT/APP/ARG/PUTT from existing `round_state` (e.g. in a view or backfill). Adjust `startDistance` checks if your app uses a sentinel for “unknown” (e.g. `-1` or null).

```sql
-- Example: compute sg_ott, sg_app, sg_arg, sg_putt per round from round_state (jsonb).
-- Assumes: shots have "lie", "strokesGained", "startDistance"; holes have "par".

WITH shot_expanded AS (
  SELECT
    r.id AS round_id,
    (h->>'par')::int AS par,
    shot.elem AS shot
  FROM rounds r,
       jsonb_array_elements(r.round_state->'holes') h,
       jsonb_array_elements(h->'shots') WITH ORDINALITY AS shot(elem, idx)
  WHERE r.round_state IS NOT NULL
    AND jsonb_typeof(r.round_state->'holes') = 'array'
),
categorized AS (
  SELECT
    round_id,
    shot->>'lie' AS lie,
    (shot->>'strokesGained')::numeric AS sg,
    (shot->>'startDistance')::int AS start_distance,
    par,
    CASE
      WHEN shot->>'lie' = 'Tee' AND par IN (4, 5) THEN 'OTT'
      WHEN shot->>'lie' = 'Green' THEN 'PUTT'
      WHEN (shot->>'startDistance')::int <= 30 AND shot->>'lie' != 'Green' THEN 'ARG'
      WHEN shot->>'lie' IN ('Fairway', 'Rough') AND (shot->>'startDistance')::int > 30 THEN 'APP'
      WHEN shot->>'lie' = 'Sand' THEN 'ARG'  -- or APP if distance > 30
      ELSE 'APP'
    END AS cat
  FROM shot_expanded
  WHERE (shot->>'strokesGained') IS NOT NULL
)
SELECT
  round_id,
  sum(sg) FILTER (WHERE cat = 'OTT') AS sg_ott,
  sum(sg) FILTER (WHERE cat = 'APP') AS sg_app,
  sum(sg) FILTER (WHERE cat = 'ARG') AS sg_arg,
  sum(sg) FILTER (WHERE cat = 'PUTT') AS sg_putt
FROM categorized
GROUP BY round_id;
```

---

## 6. Example: Dashboard view (averages by user)

If you add columns `sg_ott`, `sg_app`, `sg_arg`, `sg_putt` to `rounds`, you can expose **per-user averages** with:

```sql
CREATE OR REPLACE VIEW public.golfer_sg_dashboard AS
SELECT
  user_id,
  count(*)::int AS rounds_played,
  round(avg(sg_ott)::numeric, 2) AS avg_sg_ott,
  round(avg(sg_app)::numeric, 2) AS avg_sg_app,
  round(avg(sg_arg)::numeric, 2) AS avg_sg_arg,
  round(avg(sg_putt)::numeric, 2) AS avg_sg_putt
FROM rounds
WHERE sg_ott IS NOT NULL  -- optional: only rounds with SG populated
GROUP BY user_id;
```

---

## 7. Run order (migration → backfill → view)

Run these in the Supabase SQL Editor in order:

1. **Migration** – Add the four SG columns to `rounds`: `supabase/migrations/20250214_add_sg_category_columns.sql`
2. **Backfill** – Populate `sg_ott`, `sg_app`, `sg_arg`, `sg_putt` from existing `round_state`: `supabase/backfill_sg_categories.sql`
3. **View** – Create the dashboard view: `supabase/views/golfer_sg_dashboard.sql`

After that, new rounds should have these columns set by the app when saving; the view gives per-user averages for reporting.

Use this prompt when implementing or reviewing SG aggregation in SQL, app code, or BI tools.
