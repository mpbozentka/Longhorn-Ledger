import type { Lie, Gender } from './types';

// Strokes gained baseline data from Mark Broadie.
const BROADIE_BASELINE_MALE: Record<Lie, { distance: number; strokes: number }[]> = {
  Tee: [
    { distance: 600, strokes: 4.82 }, { distance: 580, strokes: 4.79 },
    { distance: 560, strokes: 4.74 }, { distance: 540, strokes: 4.65 },
    { distance: 520, strokes: 4.54 }, { distance: 500, strokes: 4.41 },
    { distance: 480, strokes: 4.28 }, { distance: 460, strokes: 4.17 },
    { distance: 440, strokes: 4.08 }, { distance: 420, strokes: 4.02 },
    { distance: 400, strokes: 3.99 }, { distance: 380, strokes: 3.96 },
    { distance: 360, strokes: 3.92 }, { distance: 340, strokes: 3.86 },
    { distance: 320, strokes: 3.79 }, { distance: 300, strokes: 3.71 },
    { distance: 280, strokes: 3.65 }, { distance: 260, strokes: 3.45 },
    { distance: 240, strokes: 3.25 }, { distance: 220, strokes: 3.17 },
    { distance: 200, strokes: 3.12 }, { distance: 180, strokes: 3.05 },
    { distance: 160, strokes: 2.99 }, { distance: 140, strokes: 2.97 },
    { distance: 120, strokes: 2.99 }, { distance: 100, strokes: 2.92 },
  ],
  Fairway: [
    { distance: 600, strokes: 4.94 }, { distance: 580, strokes: 4.91 },
    { distance: 560, strokes: 4.86 }, { distance: 540, strokes: 4.78 },
    { distance: 520, strokes: 4.66 }, { distance: 500, strokes: 4.53 },
    { distance: 480, strokes: 4.40 }, { distance: 460, strokes: 4.29 },
    { distance: 440, strokes: 4.20 }, { distance: 420, strokes: 4.15 },
    { distance: 400, strokes: 4.11 }, { distance: 380, strokes: 4.03 },
    { distance: 360, strokes: 3.95 }, { distance: 340, strokes: 3.88 },
    { distance: 320, strokes: 3.84 }, { distance: 300, strokes: 3.78 },
    { distance: 280, strokes: 3.69 }, { distance: 260, strokes: 3.58 },
    { distance: 240, strokes: 3.45 }, { distance: 220, strokes: 3.32 },
    { distance: 200, strokes: 3.19 }, { distance: 180, strokes: 3.08 },
    { distance: 160, strokes: 2.98 }, { distance: 140, strokes: 2.91 },
    { distance: 120, strokes: 2.85 }, { distance: 100, strokes: 2.80 },
    { distance: 80, strokes: 2.75 },  { distance: 60, strokes: 2.70 },
    { distance: 40, strokes: 2.60 },  { distance: 20, strokes: 2.40 },
  ],
  Rough: [
    { distance: 600, strokes: 5.13 }, { distance: 580, strokes: 5.10 },
    { distance: 560, strokes: 5.05 }, { distance: 540, strokes: 4.97 },
    { distance: 520, strokes: 4.85 }, { distance: 500, strokes: 4.72 },
    { distance: 480, strokes: 4.59 }, { distance: 460, strokes: 4.48 },
    { distance: 440, strokes: 4.39 }, { distance: 420, strokes: 4.34 },
    { distance: 400, strokes: 4.30 }, { distance: 380, strokes: 4.21 },
    { distance: 360, strokes: 4.11 }, { distance: 340, strokes: 4.02 },
    { distance: 320, strokes: 3.95 }, { distance: 300, strokes: 3.90 },
    { distance: 280, strokes: 3.83 }, { distance: 260, strokes: 3.74 },
    { distance: 240, strokes: 3.64 }, { distance: 220, strokes: 3.53 },
    { distance: 200, strokes: 3.42 }, { distance: 180, strokes: 3.31 },
    { distance: 160, strokes: 3.23 }, { distance: 140, strokes: 3.15 },
    { distance: 120, strokes: 3.08 }, { distance: 100, strokes: 3.02 },
    { distance: 80, strokes: 2.96 },  { distance: 60, strokes: 2.91 },
    { distance: 40, strokes: 2.78 },  { distance: 20, strokes: 2.59 },
  ],
  Sand: [
    { distance: 600, strokes: 5.52 }, { distance: 580, strokes: 5.49 },
    { distance: 560, strokes: 5.44 }, { distance: 540, strokes: 5.36 },
    { distance: 520, strokes: 5.24 }, { distance: 500, strokes: 5.11 },
    { distance: 480, strokes: 4.98 }, { distance: 460, strokes: 4.87 },
    { distance: 440, strokes: 4.78 }, { distance: 420, strokes: 4.73 },
    { distance: 400, strokes: 4.69 }, { distance: 380, strokes: 4.55 },
    { distance: 360, strokes: 4.41 }, { distance: 340, strokes: 4.26 },
    { distance: 320, strokes: 4.12 }, { distance: 300, strokes: 4.04 },
    { distance: 280, strokes: 4.00 }, { distance: 260, strokes: 3.93 },
    { distance: 240, strokes: 3.84 }, { distance: 220, strokes: 3.70 },
    { distance: 200, strokes: 3.55 }, { distance: 180, strokes: 3.40 },
    { distance: 160, strokes: 3.28 }, { distance: 140, strokes: 3.22 },
    { distance: 120, strokes: 3.21 }, { distance: 100, strokes: 3.23 },
    { distance: 80, strokes: 3.24 },  { distance: 60, strokes: 3.15 },
    { distance: 40, strokes: 2.82 },  { distance: 20, strokes: 2.53 },
  ],
  Green: [
    { distance: 90, strokes: 2.40 }, { distance: 60, strokes: 2.21 },
    { distance: 50, strokes: 2.14 }, { distance: 40, strokes: 2.06 },
    { distance: 30, strokes: 1.98 }, { distance: 20, strokes: 1.87 },
    { distance: 15, strokes: 1.78 }, { distance: 10, strokes: 1.61 },
    { distance: 9, strokes: 1.56 },  { distance: 8, strokes: 1.50 },
    { distance: 7, strokes: 1.42 },  { distance: 6, strokes: 1.34 },
    { distance: 5, strokes: 1.23 },  { distance: 4, strokes: 1.13 },
    { distance: 3, strokes: 1.04 },
  ],
};

const BROADIE_BASELINE_FEMALE: Record<Lie, { distance: number; strokes: number }[]> = {
    Tee: [
      { distance: 600, strokes: 5.34 }, { distance: 580, strokes: 5.28 },
      { distance: 560, strokes: 5.22 }, { distance: 540, strokes: 5.15 },
      { distance: 520, strokes: 5.07 }, { distance: 500, strokes: 4.96 },
      { distance: 480, strokes: 4.82 }, { distance: 460, strokes: 4.70 },
      { distance: 440, strokes: 4.59 }, { distance: 420, strokes: 4.45 },
      { distance: 400, strokes: 4.30 }, { distance: 380, strokes: 4.16 },
      { distance: 360, strokes: 4.04 }, { distance: 340, strokes: 3.96 },
      { distance: 320, strokes: 3.88 }, { distance: 300, strokes: 3.79 },
      { distance: 280, strokes: 3.69 }, { distance: 260, strokes: 3.58 },
      { distance: 240, strokes: 3.47 }, { distance: 220, strokes: 3.35 },
      { distance: 200, strokes: 3.22 }, { distance: 180, strokes: 3.10 },
      { distance: 160, strokes: 3.00 }, { distance: 140, strokes: 2.92 },
      { distance: 120, strokes: 2.86 }, { distance: 100, strokes: 2.81 },
    ],
    Fairway: [
      { distance: 600, strokes: 5.40 }, { distance: 580, strokes: 5.34 },
      { distance: 560, strokes: 5.27 }, { distance: 540, strokes: 5.19 },
      { distance: 520, strokes: 5.09 }, { distance: 500, strokes: 4.97 },
      { distance: 480, strokes: 4.84 }, { distance: 460, strokes: 4.72 },
      { distance: 440, strokes: 4.61 }, { distance: 420, strokes: 4.47 },
      { distance: 400, strokes: 4.32 }, { distance: 380, strokes: 4.18 },
      { distance: 360, strokes: 4.07 }, { distance: 340, strokes: 3.98 },
      { distance: 320, strokes: 3.90 }, { distance: 300, strokes: 3.82 },
      { distance: 280, strokes: 3.73 }, { distance: 260, strokes: 3.63 },
      { distance: 240, strokes: 3.52 }, { distance: 220, strokes: 3.40 },
      { distance: 200, strokes: 3.26 }, { distance: 180, strokes: 3.13 },
      { distance: 160, strokes: 3.02 }, { distance: 140, strokes: 2.94 },
      { distance: 120, strokes: 2.87 }, { distance: 100, strokes: 2.82 },
      { distance: 80, strokes: 2.76 },  { distance: 60, strokes: 2.70 },
      { distance: 40, strokes: 2.60 },  { distance: 20, strokes: 2.40 },
    ],
    Rough: [
      { distance: 600, strokes: 5.48 }, { distance: 580, strokes: 5.42 },
      { distance: 560, strokes: 5.35 }, { distance: 540, strokes: 5.27 },
      { distance: 520, strokes: 5.17 }, { distance: 500, strokes: 5.05 },
      { distance: 480, strokes: 4.92 }, { distance: 460, strokes: 4.80 },
      { distance: 440, strokes: 4.69 }, { distance: 420, strokes: 4.55 },
      { distance: 400, strokes: 4.40 }, { distance: 380, strokes: 4.26 },
      { distance: 360, strokes: 4.15 }, { distance: 340, strokes: 4.07 },
      { distance: 320, strokes: 3.99 }, { distance: 300, strokes: 3.91 },
      { distance: 280, strokes: 3.82 }, { distance: 260, strokes: 3.72 },
      { distance: 240, strokes: 3.61 }, { distance: 220, strokes: 3.49 },
      { distance: 200, strokes: 3.35 }, { distance: 180, strokes: 3.22 },
      { distance: 160, strokes: 3.11 }, { distance: 140, strokes: 3.03 },
      { distance: 120, strokes: 2.96 }, { distance: 100, strokes: 2.91 },
      { distance: 80, strokes: 2.85 },  { distance: 60, strokes: 2.79 },
      { distance: 40, strokes: 2.69 },  { distance: 20, strokes: 2.49 },
    ],
    Sand: [
      { distance: 600, strokes: 5.60 }, { distance: 580, strokes: 5.54 },
      { distance: 560, strokes: 5.47 }, { distance: 540, strokes: 5.39 },
      { distance: 520, strokes: 5.29 }, { distance: 500, strokes: 5.17 },
      { distance: 480, strokes: 5.04 }, { distance: 460, strokes: 4.92 },
      { distance: 440, strokes: 4.81 }, { distance: 420, strokes: 4.67 },
      { distance: 400, strokes: 4.52 }, { distance: 380, strokes: 4.38 },
      { distance: 360, strokes: 4.27 }, { distance: 340, strokes: 4.19 },
      { distance: 320, strokes: 4.11 }, { distance: 300, strokes: 4.03 },
      { distance: 280, strokes: 3.94 }, { distance: 260, strokes: 3.84 },
      { distance: 240, strokes: 3.73 }, { distance: 220, strokes: 3.61 },
      { distance: 200, strokes: 3.47 }, { distance: 180, strokes: 3.34 },
      { distance: 160, strokes: 3.23 }, { distance: 140, strokes: 3.15 },
      { distance: 120, strokes: 3.08 }, { distance: 100, strokes: 3.03 },
      { distance: 80, strokes: 2.97 },  { distance: 60, strokes: 2.91 },
      { distance: 40, strokes: 2.81 },  { distance: 20, strokes: 2.61 },
    ],
    Green: [
      { distance: 90, strokes: 2.50 }, { distance: 60, strokes: 2.29 },
      { distance: 50, strokes: 2.21 }, { distance: 40, strokes: 2.12 },
      { distance: 30, strokes: 2.02 }, { distance: 20, strokes: 1.90 },
      { distance: 15, strokes: 1.81 }, { distance: 10, strokes: 1.63 },
      { distance: 9, strokes: 1.58 },  { distance: 8, strokes: 1.52 },
      { distance: 7, strokes: 1.45 },  { distance: 6, strokes: 1.36 },
      { distance: 5, strokes: 1.25 },  { distance: 4, strokes: 1.15 },
      { distance: 3, strokes: 1.05 },
    ],
};


export function getExpectedStrokes(lie: Lie, distance: number, gender: Gender = 'Male'): number {
  const table = gender === 'Female' ? BROADIE_BASELINE_FEMALE[lie] : BROADIE_BASELINE_MALE[lie];
  if (!table) return 4; // Default if lie is unknown

  // Find the two points to interpolate between
  let lowerBound = table[table.length - 1];
  let upperBound = table[0];

  if (distance >= upperBound.distance) return upperBound.strokes;
  if (distance <= lowerBound.distance) return lowerBound.strokes;

  for (let i = 0; i < table.length - 1; i++) {
    if (distance >= table[i + 1].distance && distance <= table[i].distance) {
      upperBound = table[i];
      lowerBound = table[i + 1];
      break;
    }
  }

  if (upperBound.distance === lowerBound.distance) return lowerBound.strokes;

  // Linear interpolation
  const distanceRange = upperBound.distance - lowerBound.distance;
  const strokesRange = upperBound.strokes - lowerBound.strokes;
  const distanceRatio = (distance - lowerBound.distance) / distanceRange;

  return lowerBound.strokes + strokesRange * (1-distanceRatio);
}
