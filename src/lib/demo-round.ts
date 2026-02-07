import type { RoundState, Hole, Shot, Gender, TeeBox } from './types';
import { COURSE_DATA } from './course-data';
import { getExpectedStrokes } from './strokes-gained';

function calculateStrokesGainedForHole(hole: Hole, gender: Gender): Hole {
  if (hole.shots.length < 2) {
    return { ...hole, shots: hole.shots.map((s) => ({ ...s, strokesGained: undefined })) };
  }

  const shotsWithSG = hole.shots.map((shot, index) => {
    if (shot.startDistance === 0) return shot;
    if (index === hole.shots.length - 1 && !hole.isCompleted) return shot;

    const startDist = shot.lie === 'Green' ? shot.startDistance * 3 : shot.startDistance;
    const startSG = getExpectedStrokes(shot.lie, startDist, gender);

    let endSG = 0;
    const nextShot = hole.shots[index + 1];

    if (nextShot && nextShot.startDistance > 0) {
      const endDist = nextShot.lie === 'Green' ? nextShot.startDistance * 3 : nextShot.startDistance;
      endSG = getExpectedStrokes(nextShot.lie, endDist, gender);
    } else if (!nextShot && !hole.isCompleted) {
      return { ...shot, strokesGained: undefined };
    }

    const strokesGained = startSG - endSG - 1;
    return { ...shot, strokesGained };
  });

  return { ...hole, shots: shotsWithSG };
}

/**
 * Builds a simulated complete 18-hole round with realistic shot data.
 * Score: 72 (even par) with varied strokes gained by category.
 */
export function getDemoRoundState(): RoundState {
  const teeBox: TeeBox = 'Longhorn White';
  const gender: Gender = 'Male';

  const holes: Hole[] = COURSE_DATA.holes.map((holeData, idx) => {
    const yardage = holeData.teeBoxes[teeBox];
    const par = holeData.par;
    const shots: Shot[] = [];

    // Shot 1: Tee
    shots.push({
      shotNumber: 1,
      startDistance: yardage,
      lie: 'Tee',
      club: 'Dr',
    });

    // Middle shots - par on each hole (strokes = shots.length - 1 for completed)
    if (par === 3) {
      shots.push({ shotNumber: 2, startDistance: 20 / 3, lie: 'Green', club: 'Putter' });
      shots.push({ shotNumber: 3, startDistance: 8 / 3, lie: 'Green', club: 'Putter' });
    } else if (par === 4) {
      shots.push({ shotNumber: 2, startDistance: 120, lie: 'Fairway', club: '8i' });
      shots.push({ shotNumber: 3, startDistance: 15 / 3, lie: 'Green', club: 'Putter' });
      shots.push({ shotNumber: 4, startDistance: 5 / 3, lie: 'Green', club: 'Putter' });
    } else {
      shots.push({ shotNumber: 2, startDistance: 220, lie: 'Fairway', club: '5i' });
      shots.push({ shotNumber: 3, startDistance: 100, lie: 'Fairway', club: 'PW' });
      shots.push({ shotNumber: 4, startDistance: 25 / 3, lie: 'Green', club: 'Putter' });
      shots.push({ shotNumber: 5, startDistance: 10 / 3, lie: 'Green', club: 'Putter' });
    }

    // Hole out
    shots.push({
      shotNumber: shots.length + 1,
      startDistance: 0,
      lie: 'Green',
    });

    const hole: Hole = {
      holeNumber: idx + 1,
      par,
      yardage,
      shots,
      isCompleted: true,
    };

    return calculateStrokesGainedForHole(hole, gender);
  });

  return {
    golferName: 'Demo Golfer',
    gender,
    teeBox,
    holes,
    currentHoleIndex: 17,
    activeShotIndex: 0,
    isRoundCompleted: true,
  };
}
