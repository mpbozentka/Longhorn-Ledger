import type { RoundState, Hole, Shot } from './types';

export function exportRoundToCsv(roundState: RoundState) {
  if (!roundState.golferName) {
    alert('No golfer data to export.');
    return;
  }
  
  const completedHoles = roundState.holes.filter(hole => hole.isCompleted);

  if (completedHoles.length === 0) {
    alert("No completed holes to export.");
    return;
  }

  const headers = [
    'Golfer',
    'Tee Box',
    'Hole',
    'Par',
    'Yardage',
    'Shot',
    'Lie',
    'Club Used',
    'Start Distance',
    'Start Distance Unit',
    'End Distance',
    'End Distance Unit',
    'Shot Distance (yds)',
    'Strokes Gained',
  ];

  const rows: (string | number | undefined)[][] = [];
  
  completedHoles.forEach((hole: Hole) => {
    // We iterate to length - 1 to exclude the final "in the hole" shot
    for (let i = 0; i < hole.shots.length - 1; i++) {
      const shot = hole.shots[i];
      const nextShot = hole.shots[i + 1];
      
      const startDistanceDisplay = shot.lie === 'Green' ? (shot.startDistance * 3).toFixed(1) : shot.startDistance.toFixed(0);
      const startUnit = shot.lie === 'Green' ? 'ft' : 'yds';

      let endDistanceDisplay: string;
      let endUnit: string;
      let endDistanceYds: number;

      if (nextShot.startDistance === 0) {
        endDistanceDisplay = '0';
        endUnit = 'in hole';
        endDistanceYds = 0;
      } else {
        endDistanceDisplay = nextShot.lie === 'Green' ? (nextShot.startDistance * 3).toFixed(1) : nextShot.startDistance.toFixed(0);
        endUnit = nextShot.lie === 'Green' ? 'ft' : 'yds';
        endDistanceYds = nextShot.startDistance;
      }
      
      const shotDistance = shot.startDistance - endDistanceYds;

      rows.push([
        roundState.golferName,
        roundState.teeBox,
        hole.holeNumber,
        hole.par,
        hole.yardage,
        shot.shotNumber,
        shot.lie,
        shot.club,
        startDistanceDisplay,
        startUnit,
        endDistanceDisplay,
        endUnit,
        shotDistance > 0 ? shotDistance.toFixed(0) : '0',
        shot.strokesGained?.toFixed(3),
      ]);
    }
  });

  if (rows.length === 0) {
    alert('No shots to export.');
    return;
  }

  let csvContent = headers.join(',') + '\r\n';
  rows.forEach((rowArray) => {
    let row = rowArray.map(item => `"${item ?? ''}"`).join(',');
    csvContent += row + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `longhorn-links-round-${roundState.golferName}-${date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
