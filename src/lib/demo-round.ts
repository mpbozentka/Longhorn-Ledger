import type { RoundState, Hole, Shot, Gender, TeeBox } from './types';
import { COURSE_DATA } from './course-data';
import { getExpectedStrokes } from './strokes-gained';

const teeBox: TeeBox = 'Longhorn White';
const gender: Gender = 'Male';

/** Seeded RNG for deterministic but varied demo data (Mulberry32). */
function createSeededRandom(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randIn(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function choose<T>(rng: () => number, options: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let u = rng() * total;
  for (let i = 0; i < options.length; i++) {
    u -= weights[i];
    if (u <= 0) return options[i];
  }
  return options[options.length - 1];
}

function calculateStrokesGainedForHole(hole: Hole, g: Gender): Hole {
  if (hole.shots.length < 2) {
    return { ...hole, shots: hole.shots.map((s) => ({ ...s, strokesGained: undefined })) };
  }

  const shotsWithSG = hole.shots.map((shot, index) => {
    if (shot.startDistance === 0) return shot;
    if (index === hole.shots.length - 1 && !hole.isCompleted) return shot;

    const startDist = shot.lie === 'Green' ? shot.startDistance * 3 : shot.startDistance;
    const startSG = getExpectedStrokes(shot.lie, startDist, g);

    let endSG = 0;
    const nextShot = hole.shots[index + 1];

    if (nextShot && nextShot.startDistance > 0) {
      const endDist = nextShot.lie === 'Green' ? nextShot.startDistance * 3 : nextShot.startDistance;
      endSG = getExpectedStrokes(nextShot.lie, endDist, g);
    } else if (!nextShot && !hole.isCompleted) {
      return { ...shot, strokesGained: undefined };
    }

    const strokesGained = startSG - endSG - 1;
    return { ...shot, strokesGained };
  });

  return { ...hole, shots: shotsWithSG };
}

type Lie = Shot['lie'];

/**
 * Build one hole with realistic driver (275±15 yds, 60% fairway / 36% rough / 4% sand),
 * approach (60% on green 30±25 ft, 40% miss 25±10 yds even F/R/S), and putts.
 * Target strokes is the desired total for this hole.
 */
function buildHoleShotsRealistic(
  roundSeed: number,
  holeIndex: number,
  par: number,
  yardage: number,
  targetStrokes: number
): Shot[] {
  const rng = createSeededRandom(roundSeed * 1000 + holeIndex * 37);
  const shots: Shot[] = [];

  // --- Tee shot ---
  shots.push({
    shotNumber: 1,
    startDistance: yardage,
    lie: 'Tee',
    club: 'Dr',
  });

  let strokeCount = 1;
  let currentLie: Lie = 'Tee';
  let currentYards = yardage;

  if (par === 3) {
    // Hole-in-one: target 2
    if (targetStrokes === 2) {
      shots.push({ shotNumber: 2, startDistance: 0, lie: 'Green' });
      return shots;
    }
    // Par 3: tee shot is the "approach" — 60% on green at 30±25 ft, 40% miss at 25±10 yds (even F/R/S)
    const mustHitGreen = targetStrokes - strokeCount <= 2;
    const hitGreen = mustHitGreen || rng() < 0.6;
    if (hitGreen) {
      const feet = Math.max(5, Math.min(55, randIn(rng, 30 - 25, 30 + 25)));
      currentYards = feet / 3;
      currentLie = 'Green';
      shots.push({
        shotNumber: 2,
        startDistance: currentYards,
        lie: 'Green',
        club: 'Putter',
      });
      strokeCount = 2;
    } else {
      const yards = randIn(rng, 25 - 10, 25 + 10);
      currentYards = Math.max(15, Math.min(35, yards));
      currentLie = choose(rng, ['Fairway', 'Rough', 'Sand'] as Lie[], [1 / 3, 1 / 3, 1 / 3]);
      shots.push({
        shotNumber: 2,
        startDistance: currentYards,
        lie: currentLie,
        club: currentLie === 'Sand' ? 'SW' : 'PW',
      });
      strokeCount = 2;
      // Chip onto green — land at 15±10 ft
      const chipFeet = Math.max(5, Math.min(25, randIn(rng, 5, 25)));
      shots.push({
        shotNumber: 3,
        startDistance: chipFeet / 3,
        lie: 'Green',
        club: 'Putter',
      });
      currentLie = 'Green';
      currentYards = chipFeet / 3;
      strokeCount = 3;
    }
  } else {
    // Par 4/5: driver 275±15, 60% fairway / 36% rough / 4% sand
    const drive = Math.round(randIn(rng, 275 - 15, 275 + 15));
    const hitFairway = rng() < 0.6;
    if (hitFairway) {
      currentLie = 'Fairway';
    } else {
      currentLie = rng() < 0.9 ? 'Rough' : 'Sand';
    }
    currentYards = Math.max(0, yardage - drive);
    shots.push({
      shotNumber: 2,
      startDistance: currentYards,
      lie: currentLie,
      club: currentLie === 'Sand' ? 'SW' : currentYards > 150 ? '5i' : 'PW',
    });
    strokeCount = 2;

    // If still far out, add an advance shot (e.g. layup or second to get in range)
    while (currentYards > 120 && strokeCount < targetStrokes - 2) {
      const advance = Math.min(currentYards - 50, randIn(rng, 80, 140));
      currentYards = Math.max(40, currentYards - advance);
      currentLie = currentLie === 'Sand' ? currentLie : (rng() < 0.85 ? 'Fairway' : 'Rough');
      shots.push({
        shotNumber: shots.length + 1,
        startDistance: Math.round(currentYards),
        lie: currentLie,
        club: currentYards > 100 ? '7i' : 'PW',
      });
      strokeCount++;
    }

    // Approach: 60% on green 30±25 ft, 40% miss 25±10 yds (even F/R/S)
    if (currentLie !== 'Green') {
      const mustHitGreen = targetStrokes - strokeCount <= 2;
      const hitGreen = mustHitGreen || rng() < 0.6;
      if (hitGreen) {
        const feet = Math.max(5, Math.min(55, randIn(rng, 30 - 25, 30 + 25)));
        currentYards = feet / 3;
        currentLie = 'Green';
        shots.push({
          shotNumber: shots.length + 1,
          startDistance: currentYards,
          lie: 'Green',
          club: 'Putter',
        });
        strokeCount++;
      } else {
        const yards = randIn(rng, 25 - 10, 25 + 10);
        currentYards = Math.max(15, Math.min(35, yards));
        currentLie = choose(rng, ['Fairway', 'Rough', 'Sand'] as Lie[], [1 / 3, 1 / 3, 1 / 3]);
        shots.push({
          shotNumber: shots.length + 1,
          startDistance: currentYards,
          lie: currentLie,
          club: currentLie === 'Sand' ? 'SW' : 'PW',
        });
        strokeCount++;
        // Chip on
        const chipFeet = Math.max(5, Math.min(25, randIn(rng, 5, 25)));
        shots.push({
          shotNumber: shots.length + 1,
          startDistance: chipFeet / 3,
          lie: 'Green',
          club: 'Putter',
        });
        currentLie = 'Green';
        currentYards = chipFeet / 3;
        strokeCount++;
      }
    }
  }

  // Now on green. Add putts to reach targetStrokes - 1, then hole-out.
  const puttsNeeded = Math.max(0, targetStrokes - strokeCount - 1);
  for (let p = 0; p < puttsNeeded; p++) {
    const feet = currentYards * 3;
    const nextFeet = p === puttsNeeded - 1 ? 2 : Math.max(3, feet * randIn(rng, 0.15, 0.45));
    currentYards = nextFeet / 3;
    shots.push({
      shotNumber: shots.length + 1,
      startDistance: currentYards,
      lie: 'Green',
      club: 'Putter',
    });
    strokeCount++;
  }

  shots.push({
    shotNumber: shots.length + 1,
    startDistance: 0,
    lie: 'Green',
  });

  return shots;
}

function buildRoundFromStrokeCounts(roundIndex: number, strokeCounts: number[]): Hole[] {
  return COURSE_DATA.holes.map((holeData, idx) => {
    const yardage = holeData.teeBoxes[teeBox];
    const par = holeData.par;
    const strokes = strokeCounts[idx];
    const shots = buildHoleShotsRealistic(roundIndex, idx, par, yardage, strokes);
    const hole: Hole = {
      holeNumber: idx + 1,
      par,
      yardage,
      shots,
      isCompleted: true,
    };
    return calculateStrokesGainedForHole(hole, gender);
  });
}

// 10 rounds: total scores 68–80. Stroke counts per hole (realistic distribution).
const DEMO_ROUND_STROKE_COUNTS: number[][] = [
  [3, 2, 4, 3, 4, 4, 4, 2, 4, 4, 4, 3, 4, 5, 4, 2, 4, 4], // 68
  [4, 3, 4, 4, 4, 4, 4, 2, 4, 4, 5, 3, 4, 5, 4, 3, 4, 4], // 69
  [4, 3, 4, 4, 4, 4, 4, 3, 4, 4, 5, 3, 4, 5, 4, 3, 4, 4], // 70
  [4, 3, 4, 4, 4, 4, 4, 3, 5, 4, 5, 3, 4, 5, 4, 3, 4, 4], // 71
  [4, 3, 4, 4, 4, 4, 4, 3, 5, 4, 5, 3, 4, 5, 4, 3, 4, 5], // 72
  [5, 3, 4, 4, 4, 4, 4, 3, 5, 4, 5, 3, 5, 5, 4, 3, 4, 4], // 74
  [5, 4, 4, 4, 4, 5, 4, 3, 5, 4, 5, 3, 5, 5, 4, 3, 4, 4], // 76
  [5, 4, 5, 4, 4, 5, 4, 3, 5, 4, 5, 3, 5, 5, 4, 3, 4, 5], // 77
  [5, 4, 5, 4, 5, 5, 4, 3, 5, 5, 5, 3, 5, 5, 4, 3, 4, 5], // 78
  [5, 4, 5, 5, 5, 5, 5, 3, 5, 5, 5, 3, 5, 5, 4, 4, 5, 5], // 80
];

const MAX_TEE_SG_PER_ROUND = 2;
const MAX_PUTTING_SG_PER_ROUND = 4;
/** Total strokes gained per round cap. Rough estimate: total SG ≈ course par − 18-hole score − 4. */
const MAX_TOTAL_SG_PER_ROUND = 8;

function capTeeStrokesGained(holes: Hole[]): Hole[] {
  let totalTeeSG = 0;
  for (const hole of holes) {
    const teeShot = hole.shots.find((s) => s.lie === 'Tee' && s.strokesGained !== undefined);
    if (teeShot?.strokesGained != null) totalTeeSG += teeShot.strokesGained;
  }
  if (totalTeeSG <= MAX_TEE_SG_PER_ROUND) return holes;
  const scale = MAX_TEE_SG_PER_ROUND / totalTeeSG;
  return holes.map((hole) => ({
    ...hole,
    shots: hole.shots.map((shot) => {
      if (shot.lie !== 'Tee' || shot.strokesGained == null) return shot;
      return { ...shot, strokesGained: Math.round(shot.strokesGained * scale * 100) / 100 };
    }),
  }));
}

function capPuttingStrokesGained(holes: Hole[]): Hole[] {
  let totalPuttingSG = 0;
  for (const hole of holes) {
    for (const shot of hole.shots) {
      if (shot.lie === 'Green' && shot.strokesGained != null) totalPuttingSG += shot.strokesGained;
    }
  }
  if (totalPuttingSG <= MAX_PUTTING_SG_PER_ROUND) return holes;
  const scale = MAX_PUTTING_SG_PER_ROUND / totalPuttingSG;
  return holes.map((hole) => ({
    ...hole,
    shots: hole.shots.map((shot) => {
      if (shot.lie !== 'Green' || shot.strokesGained == null) return shot;
      return { ...shot, strokesGained: Math.round(shot.strokesGained * scale * 100) / 100 };
    }),
  }));
}

function capTotalStrokesGained(holes: Hole[]): Hole[] {
  let totalSG = 0;
  for (const hole of holes) {
    for (const shot of hole.shots) {
      if (shot.strokesGained != null) totalSG += shot.strokesGained;
    }
  }
  if (totalSG <= MAX_TOTAL_SG_PER_ROUND) return holes;
  const scale = MAX_TOTAL_SG_PER_ROUND / totalSG;
  return holes.map((hole) => ({
    ...hole,
    shots: hole.shots.map((shot) => {
      if (shot.strokesGained == null) return shot;
      return { ...shot, strokesGained: Math.round(shot.strokesGained * scale * 100) / 100 };
    }),
  }));
}

const DEMO_ROUNDS: RoundState[] = DEMO_ROUND_STROKE_COUNTS.map((counts, roundIndex) => {
  const holes = capTotalStrokesGained(
    capPuttingStrokesGained(capTeeStrokesGained(buildRoundFromStrokeCounts(roundIndex, counts)))
  );
  return {
    golferName: 'Demo Golfer',
    gender,
    teeBox,
    holes,
    currentHoleIndex: 17,
    activeShotIndex: 0,
    isRoundCompleted: true,
  };
});

/**
 * Returns one of 10 demo rounds (total scores 68–80) with realistic lies and distances.
 * Driver 275±15 yds, 60% fairway / 36% rough / 4% sand; approach 60% GIR 30±25 ft, 40% miss 25±10 yds.
 */
export function getDemoRoundState(roundIndex?: number): RoundState {
  const index =
    roundIndex !== undefined
      ? Math.max(0, Math.min(9, Math.floor(roundIndex)))
      : Math.floor(Math.random() * 10);
  return DEMO_ROUNDS[index];
}
