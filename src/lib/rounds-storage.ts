import type { RoundState } from './types';
import type { Lie } from './types';

export type SGCategory = 'Tee' | 'Approach' | 'Short Game' | 'Putting';

const getCategory = (lie: Lie): SGCategory => {
  switch (lie) {
    case 'Tee':
      return 'Tee';
    case 'Fairway':
    case 'Rough':
      return 'Approach';
    case 'Sand':
      return 'Short Game';
    case 'Green':
      return 'Putting';
    default:
      return 'Approach';
  }
};

/** Returns strokes gained per category for a round (for trends / averages). */
export function getSgByCategoryForRound(state: RoundState): Record<SGCategory, number> {
  const acc: Record<SGCategory, number> = { Tee: 0, Approach: 0, 'Short Game': 0, Putting: 0 };
  for (const hole of state.holes) {
    for (const shot of hole.shots) {
      if (shot.lie && shot.strokesGained != null) {
        acc[getCategory(shot.lie)] += shot.strokesGained;
      }
    }
  }
  return acc;
}

export function computeRoundStats(state: RoundState): { totalScore: number; totalSG: number } {
  const playedHoles = state.holes;
  const totalScore = playedHoles.reduce(
    (sum, hole) => sum + (hole.isCompleted ? hole.shots.length - 1 : hole.shots.length),
    0
  );
  const sgByCategory = getSgByCategoryForRound(state);
  const totalSG = Object.values(sgByCategory).reduce((sum, val) => sum + val, 0);
  return { totalScore, totalSG };
}

export type SavedRound = {
  date: string; // ISO
  totalScore: number;
  totalSG: number;
  roundState: RoundState;
  /** Total fairways hit (Par 4 & 5). From DB when loaded; computed on save. */
  fir_count?: number;
  /** Total greens in regulation. From DB when loaded; computed on save. */
  gir_count?: number;
  /** Total putts for the round. From DB when loaded; computed on save. */
  total_putts?: number;
};

/** Shape of public.golfer_dashboard_stats view (optional; use when querying the view by user_id). */
export type GolferDashboardStats = {
  user_id: string;
  round_count: number;
  avg_score: number;
  avg_total_sg: number;
  avg_fir_count: number;
  avg_gir_count: number;
  avg_total_putts: number;
};

/** Fetch rounds from Supabase via API (uses current Clerk session). */
export async function getRounds(): Promise<SavedRound[]> {
  const res = await fetch('/api/rounds', { credentials: 'include' });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error(await res.text());
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Save a round to Supabase via API (uses current Clerk session). */
export async function saveRound(roundState: RoundState): Promise<void> {
  const res = await fetch('/api/rounds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(roundState),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
}
