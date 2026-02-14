'use client';

import { useState, useEffect, useRef } from 'react';
import { useRound } from '@/context/round-context';
import type { Shot, Lie, Club } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { CLUBS, BLANK_DISTANCE } from '@/lib/types';

type ShotCardProps = {
  shot: Shot;
  shotIndex: number;
  isHoleCompleted: boolean;
  endDistance: number;
};

const LIES: Lie[] = ['Tee', 'Fairway', 'Rough', 'Sand', 'Green'];

export function ShotCard({ shot, shotIndex, isHoleCompleted, endDistance }: ShotCardProps) {
  const { dispatch } = useRound();
  const [lie, setLie] = useState<Lie>(shot.lie);

  // Format initial distance: green values in feet, others in yards. Blank when not entered.
  const getDisplayDistance = (s: Shot) => {
    if (s.startDistance === BLANK_DISTANCE) return '';
    const val = s.lie === 'Green' ? (s.startDistance * 3) : s.startDistance;
    return Number.isInteger(val) ? val.toString() : val.toFixed(1);
  };

  const [distance, setDistance] = useState<string>(getDisplayDistance(shot));
  const [club, setClub] = useState<Club | 'Other'>(shot.club || (shot.lie === 'Tee' ? 'Dr' : shot.lie === 'Green' ? 'Putter' : ''));
  const [otherClub, setOtherClub] = useState(CLUBS.includes(shot.club as any) ? '' : shot.club || '');
  const [isEditing, setIsEditing] = useState(false);

  // We use a ref to prevent local typing from being overwritten by global state updates 
  // unless those updates come from an external source (like the AI).
  const lastDispatchedValueRef = useRef<number>(shot.startDistance);

  useEffect(() => {
    setLie(shot.lie);

    // Check if global state is significantly different from what we locally know.
    // This allows manual typing to feel fluid while still receiving AI updates.
    const isExternalUpdate = Math.abs(shot.startDistance - lastDispatchedValueRef.current) > 0.001;

    if (isExternalUpdate) {
      setDistance(getDisplayDistance(shot));
      lastDispatchedValueRef.current = shot.startDistance;
    }

    setClub(shot.club || (shot.lie === 'Tee' ? 'Dr' : shot.lie === 'Green' ? 'Putter' : ''));
    setOtherClub(CLUBS.includes(shot.club as any) ? '' : shot.club || '');
  }, [shot]);

  const handleLieChange = (value: Lie) => {
    setLie(value);
    if (value === 'Green') {
      setClub('Putter');
      dispatch({ type: 'UPDATE_SHOT', payload: { shotIndex, shot: { club: 'Putter' } } });
    }
    const distNum = parseFloat(distance);
    if (!isNaN(distNum)) {
      const units = value === 'Green' ? 'feet' : 'yards';
      const distInYards = units === 'feet' ? distNum / 3 : distNum;
      lastDispatchedValueRef.current = distInYards;
      dispatch({
        type: 'UPDATE_SHOT',
        payload: {
          shotIndex,
          shot: { lie: value, startDistance: distNum, units }
        }
      });
    }
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDist = e.target.value;
    setDistance(newDist);

    if (newDist === '' || newDist === '-') {
      lastDispatchedValueRef.current = BLANK_DISTANCE;
      dispatch({ type: 'UPDATE_SHOT', payload: { shotIndex, shot: { startDistance: BLANK_DISTANCE } } });
      return;
    }

    const newDistNum = parseFloat(newDist);
    if (!isNaN(newDistNum) && !newDist.endsWith('.')) {
      const units = lie === 'Green' ? 'feet' : 'yards';
      const distInYards = units === 'feet' ? newDistNum / 3 : newDistNum;

      lastDispatchedValueRef.current = distInYards;
      dispatch({
        type: 'UPDATE_SHOT',
        payload: {
          shotIndex,
          shot: { startDistance: newDistNum, units }
        }
      });
    }
  };

  const handleClubChange = (value: Club | 'Other') => {
    setClub(value);
    if (value !== 'Other') {
      dispatch({ type: 'UPDATE_SHOT', payload: { shotIndex, shot: { club: value } } });
      setOtherClub('');
    }
  };

  const handleOtherClubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOtherClub = e.target.value;
    setOtherClub(newOtherClub);
    dispatch({ type: 'UPDATE_SHOT', payload: { shotIndex, shot: { club: newOtherClub.trim() } } });
  };

  const isBlankDist = shot.startDistance === BLANK_DISTANCE;
  const shotDistanceValue = isBlankDist ? 0 : shot.startDistance - endDistance;
  const distanceUnit = shot.lie === 'Green' ? 'ft' : 'yds';
  const displayDistance = isBlankDist ? '—' : shot.lie === 'Green' ? (shot.startDistance * 3).toFixed(1) : shot.startDistance.toFixed(0);

  const isEditable = !isHoleCompleted || isEditing;

  return (
    <Card
      className={isHoleCompleted && !isEditing ? 'bg-muted/30 cursor-pointer hover:bg-muted/50' : ''}
      onClick={() => {
        if (isHoleCompleted && !isEditing) {
          setIsEditing(true)
        }
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Shot {shot.shotNumber}</CardTitle>
          {!isEditable && (
            <CardDescription>
              {shot.lie}
              {shot.club && ` / ${shot.club}`}
              {' / '}
              {displayDistance} {distanceUnit}
            </CardDescription>
          )}
        </div>
        {typeof shot.strokesGained === 'number' && (
          <div className='text-right'>
            <p className={`font-bold text-lg ${shot.strokesGained > 0 ? 'text-green-600' : 'text-red-600'}`}>{shot.strokesGained.toFixed(2)}</p>
            <p className='text-xs text-muted-foreground'>Strokes Gained</p>
          </div>
        )}
      </CardHeader>

      {shotDistanceValue > 0 && (
        <CardContent>
          <p className="text-sm font-semibold text-muted-foreground">Shot Distance: <span className='font-bold text-foreground'>{shotDistanceValue.toFixed(0)} yds</span></p>
        </CardContent>
      )}

      {isEditable && (
        <CardFooter className="flex-col items-start space-y-4" onClick={(e) => e.stopPropagation()}>
          <div className="grid w-full grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor={`lie-${shot.shotNumber}`}>Lie / Surface</Label>
              <Select
                value={lie}
                onValueChange={handleLieChange}
                disabled={shot.shotNumber === 1}
              >
                <SelectTrigger id={`lie-${shot.shotNumber}`}>
                  <SelectValue placeholder="Select a lie" />
                </SelectTrigger>
                <SelectContent>
                  {LIES.map((l) => (
                    <SelectItem key={l} value={l} disabled={shot.shotNumber !== 1 && l === 'Tee'}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor={`distance-${shot.shotNumber}`}>Distance to Pin ({lie === 'Green' ? 'feet' : 'yds'})</Label>
              <Input
                id={`distance-${shot.shotNumber}`}
                type="number"
                value={distance}
                onChange={handleDistanceChange}
                placeholder={lie === 'Green' ? 'e.g. 15' : 'e.g. 120'}
                disabled={shot.shotNumber === 1}
              />
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor={`club-${shot.shotNumber}`}>Club Used (Optional)</Label>
              <Select
                value={club}
                onValueChange={handleClubChange}
              >
                <SelectTrigger id={`club-${shot.shotNumber}`}>
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {CLUBS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">Other...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {club === 'Other' && (
              <div className="space-y-2 col-span-2 sm:col-span-1 self-end">
                <Input
                  id={`other-club-${shot.shotNumber}`}
                  type="text"
                  value={otherClub}
                  onChange={handleOtherClubChange}
                  placeholder="Enter club"
                />
              </div>
            )}
          </div>
          {isEditing && <Button onClick={() => setIsEditing(false)} size="sm">Done Editing</Button>}
        </CardFooter>
      )}
    </Card>
  );
}
