import type { RoundState, Hole } from './types';
import type { SavedRound } from './rounds-storage';

/** Whether a round is "complete" for dashboard averages (18 holes, round marked complete). */
export function isCompleteRound(round: SavedRound): boolean {
  const { roundState } = round;
  return (
    roundState.isRoundCompleted === true &&
    roundState.holes.length === 18 &&
    roundState.holes.every((h) => h.isCompleted)
  );
}

/** Filter options for dashboard aggregates. Incomplete rounds are excluded when completeRoundsOnly is true. */
export type DashboardFilter = {
  /** Max number of rounds to include (most recent first). Omit for all rounds in the list. */
  roundLimit?: number;
  /** If true, only include rounds that have 18 completed holes. Default true. */
  completeRoundsOnly?: boolean;
};

function applyFilter(rounds: SavedRound[], filter: DashboardFilter): SavedRound[] {
  let list = filter.completeRoundsOnly !== false ? rounds.filter(isCompleteRound) : rounds;
  if (filter.roundLimit != null && filter.roundLimit > 0) list = list.slice(0, filter.roundLimit);
  return list;
}

function getHoleScore(hole: Hole): number {
  return hole.isCompleted ? hole.shots.length - 1 : hole.shots.length;
}

function getHolePutts(hole: Hole): number {
  return hole.shots.filter((s) => s.lie === 'Green').length;
}

/** Fairway in Regulation: only Par 4 and Par 5. Hit = second shot was from Fairway. */
export function getFIRForRound(state: RoundState): { hit: number; total: number; percentage: number } {
  let hit = 0;
  let total = 0;
  for (const hole of state.holes) {
    if (hole.par !== 4 && hole.par !== 5) continue;
    // Only count holes where we have at least 2 shots (tee + next) so we know fairway status
    if (hole.shots.length < 2) continue;
    total += 1;
    if (hole.shots[1].lie === 'Fairway') hit += 1;
  }
  const percentage = total > 0 ? Math.round((hit / total) * 100) : 0;
  return { hit, total, percentage };
}

/** Green in Regulation: on putting surface in (Par - 2) strokes or less. GIR = (HoleScore - HolePutts) <= (Par - 2). */
export function getGIRForRound(state: RoundState): { hit: number; total: number } {
  let hit = 0;
  const total = state.holes.length;
  for (const hole of state.holes) {
    const score = getHoleScore(hole);
    const putts = getHolePutts(hole);
    const strokesToReachGreen = score - putts;
    if (strokesToReachGreen <= hole.par - 2) hit += 1;
  }
  return { hit, total };
}

/** Total putts for the round (sum of putts on each hole). */
export function getPuttsForRound(state: RoundState): number {
  return state.holes.reduce((sum, hole) => sum + getHolePutts(hole), 0);
}

/** Dashboard: FIR across rounds. Uses only complete rounds by default; incomplete rounds are excluded. */
export function getFIRForRounds(
  rounds: SavedRound[],
  filter: DashboardFilter = {}
): { hit: number; total: number; percentage: number; roundCount: number } {
  const list = applyFilter(rounds, { completeRoundsOnly: true, ...filter });
  let hit = 0;
  let total = 0;
  for (const r of list) {
    const fir = getFIRForRound(r.roundState);
    hit += fir.hit;
    total += fir.total;
  }
  const percentage = total > 0 ? Math.round((hit / total) * 100) : 0;
  return { hit, total, percentage, roundCount: list.length };
}

/** Dashboard: GIR average per round. Uses only complete rounds by default. */
export function getGIRForRounds(
  rounds: SavedRound[],
  filter: DashboardFilter = {}
): { totalGIR: number; roundCount: number; averagePerRound: number } {
  const list = applyFilter(rounds, { completeRoundsOnly: true, ...filter });
  let totalGIR = 0;
  for (const r of list) {
    totalGIR += getGIRForRound(r.roundState).hit;
  }
  const roundCount = list.length;
  const averagePerRound = roundCount > 0 ? Math.round((totalGIR / roundCount) * 10) / 10 : 0;
  return { totalGIR, roundCount, averagePerRound };
}

/** Dashboard: Putts average per round. Uses only complete rounds by default. */
export function getPuttsForRounds(
  rounds: SavedRound[],
  filter: DashboardFilter = {}
): { totalPutts: number; roundCount: number; averagePutts: number } {
  const list = applyFilter(rounds, { completeRoundsOnly: true, ...filter });
  let totalPutts = 0;
  for (const r of list) {
    totalPutts += getPuttsForRound(r.roundState);
  }
  const roundCount = list.length;
  const averagePutts = roundCount > 0 ? Math.round((totalPutts / roundCount) * 10) / 10 : 0;
  return { totalPutts, roundCount, averagePutts };
}
