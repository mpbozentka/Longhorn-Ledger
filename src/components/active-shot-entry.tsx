'use client';

import React, { useState, useCallback } from 'react';
import { useRound } from '@/context/round-context';
import type { Shot, Lie, Club } from '@/lib/types';
import { CLUBS } from '@/lib/types';
import { Crosshair, Goal, Minus, Plus, ArrowRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LIES: { value: Lie; label: string }[] = [
  { value: 'Tee', label: 'Tee' },
  { value: 'Fairway', label: 'Fairway' },
  { value: 'Rough', label: 'Rough' },
  { value: 'Sand', label: 'Bunker' },
  { value: 'Green', label: 'Green' },
];

const CLUB_DISPLAY: Record<string, string> = {
  Dr: 'Driver',
  '3w': '3W',
  '5w': '5W',
  '3 Hyb': '3H',
  '4 Hyb': '4H',
  '5 Hyb': '5H',
  '6 Hyb': '6H',
  '3i': '3i',
  '4i': '4i',
  '5i': '5i',
  '6i': '6i',
  '7i': '7i',
  '8i': '8i',
  '9i': '9i',
  PW: 'PW',
  GW: 'GW',
  SW: 'SW',
  LW: 'LW',
  Putter: 'Putter',
};

function clubLabel(club: Club): string {
  return typeof club === 'string' && CLUB_DISPLAY[club] ? CLUB_DISPLAY[club] : String(club);
}

type ActiveShotEntryProps = {
  currentHole: { holeNumber: number; par: number; yardage: number; shots: Shot[]; isCompleted: boolean };
  activeShot: Shot;
  activeShotIndex: number;
  onAddShot: () => void;
  onHoleOut: () => void;
  canHoleOut: boolean;
};

export function ActiveShotEntry({
  currentHole,
  activeShot,
  activeShotIndex,
  onAddShot,
  onHoleOut,
  canHoleOut,
}: ActiveShotEntryProps) {
  const { dispatch } = useRound();
  const isGreen = activeShot.lie === 'Green';
  const displayValue = isGreen ? Math.round(activeShot.startDistance * 3) : Math.round(activeShot.startDistance);
  const [displayStr, setDisplayStr] = useState(String(displayValue));

  const syncDisplayToShot = useCallback(() => {
    const v = isGreen ? Math.round(activeShot.startDistance * 3) : Math.round(activeShot.startDistance);
    setDisplayStr(String(v));
  }, [activeShot.startDistance, isGreen]);

  React.useEffect(() => {
    syncDisplayToShot();
  }, [activeShot.startDistance, activeShot.lie, syncDisplayToShot]);

  const applyDistance = useCallback(
    (num: number) => {
      const units = isGreen ? 'feet' : 'yards';
      const yards = isGreen ? num / 3 : num;
      dispatch({
        type: 'UPDATE_SHOT',
        payload: { shotIndex: activeShotIndex, shot: { startDistance: num, units } },
      });
      if (activeShotIndex === 0 && !isGreen) {
        dispatch({ type: 'UPDATE_YARDAGE', payload: yards });
      }
      setDisplayStr(String(num));
    },
    [dispatch, activeShotIndex, isGreen]
  );

  const handleLieChange = (lie: Lie) => {
    dispatch({ type: 'UPDATE_SHOT', payload: { shotIndex: activeShotIndex, shot: { lie } } });
    if (lie === 'Green') {
      dispatch({ type: 'UPDATE_SHOT', payload: { shotIndex: activeShotIndex, shot: { club: 'Putter' } } });
    }
  };

  const handleClubChange = (club: Club) => {
    dispatch({ type: 'UPDATE_SHOT', payload: { shotIndex: activeShotIndex, shot: { club } } });
  };

  const handleDistanceDelta = (delta: number) => {
    const num = parseInt(displayStr, 10) || 0;
    const next = Math.max(0, Math.min(isGreen ? 999 : 999, num + delta));
    setDisplayStr(String(next));
    applyDistance(next);
  };

  const handleKeypad = (key: string) => {
    if (key === 'C') {
      setDisplayStr('0');
      applyDistance(0);
      return;
    }
    if (key === 'backspace') {
      const next = displayStr.slice(0, -1) || '0';
      setDisplayStr(next);
      const num = parseInt(next, 10);
      applyDistance(isNaN(num) ? 0 : num);
      return;
    }
    const digit = key;
    const nextStr = displayStr === '0' ? digit : displayStr + digit;
    const next = parseInt(nextStr, 10);
    if (next <= (isGreen ? 999 : 999)) {
      setDisplayStr(nextStr);
      applyDistance(next);
    }
  };

  const sectionBorder = 'border-border';
  const mutedBg = 'bg-muted';
  const cardBg = 'bg-card';

  return (
    <div className="flex flex-col gap-8 max-w-[600px] w-full">
      {/* Hole info */}
      <div className="flex flex-col items-center text-center gap-1">
        <p className="text-6xl font-black leading-none tracking-tighter text-foreground">Hole {currentHole.holeNumber}</p>
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10">
          <span className="text-primary text-lg font-semibold">Par {currentHole.par}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground font-medium">{currentHole.yardage} Yards</span>
        </div>
      </div>

      {/* Main card */}
      <div className={cn('rounded-xl shadow-xl border overflow-hidden', cardBg, sectionBorder)}>
        {/* Lie selection */}
        <div className={cn('p-6 border-b', sectionBorder)}>
          <h2 className="text-foreground text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
            <Crosshair className="size-5 text-primary" />
            Select Lie
          </h2>
          <div className={cn('flex h-14 w-full items-center justify-center rounded-xl p-1.5 gap-1', mutedBg)}>
            {LIES.map(({ value, label }) => (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 transition-all text-sm font-bold uppercase tracking-tight',
                  activeShot.lie === value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted-foreground/10'
                )}
              >
                <span className="truncate">{label}</span>
                <input
                  type="radio"
                  name="lie-selection"
                  value={value}
                  checked={activeShot.lie === value}
                  onChange={() => handleLieChange(value)}
                  className="invisible w-0"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Club selection */}
        <div className={cn('p-6 border-b', sectionBorder)}>
          <h2 className="text-foreground text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
            <Goal className="size-5 text-primary" />
            Select Club
          </h2>
          <div className="overflow-x-auto hide-scrollbar -mx-2 px-2">
            <div className="flex gap-2 pb-2">
              {CLUBS.map((club) => (
                <label key={club} className="flex-shrink-0 cursor-pointer">
                  <input
                    type="radio"
                    name="club-selection"
                    checked={(activeShot.club ?? 'Dr') === club}
                    onChange={() => handleClubChange(club)}
                    className="hidden peer"
                  />
                  <div
                    className={cn(
                      'flex items-center justify-center min-w-[70px] h-14 rounded-xl border-2 transition-all font-bold text-sm',
                      (activeShot.club ?? 'Dr') === club
                        ? 'bg-primary text-primary-foreground border-primary'
                        : cn(mutedBg, 'border-transparent hover:bg-primary/10 hover:text-primary')
                    )}
                  >
                    {clubLabel(club)}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Distance */}
        <div className="p-8 flex flex-col items-center">
          <h2 className="text-foreground text-lg font-bold mb-6 uppercase tracking-widest">Distance to Hole</h2>
          <div className="flex items-center gap-6 mb-8">
            <button
              type="button"
              className={cn('size-16 flex items-center justify-center rounded-full border-2 border-transparent active:border-primary', mutedBg, 'text-foreground')}
              onClick={() => handleDistanceDelta(isGreen ? -1 : -5)}
              aria-label="Decrease distance"
            >
              <Minus className="size-8" />
            </button>
            <div className="flex flex-col items-center min-w-[140px]">
              <span className="text-7xl font-black text-foreground tracking-tighter tabular-nums">{displayStr}</span>
              <span className="text-primary font-bold text-xl uppercase">{isGreen ? 'Feet' : 'Yards'}</span>
            </div>
            <button
              type="button"
              className={cn('size-16 flex items-center justify-center rounded-full border-2 border-transparent active:border-primary', mutedBg, 'text-foreground')}
              onClick={() => handleDistanceDelta(isGreen ? 1 : 5)}
              aria-label="Increase distance"
            >
              <Plus className="size-8" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full max-w-[320px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                type="button"
                className={cn('h-14 rounded-xl font-bold text-xl transition-colors', mutedBg, 'text-foreground hover:bg-primary hover:text-primary-foreground')}
                onClick={() => handleKeypad(d)}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              className={cn('h-14 rounded-xl font-bold text-xl transition-colors text-destructive', mutedBg, 'hover:bg-destructive hover:text-destructive-foreground')}
              onClick={() => handleKeypad('C')}
            >
              C
            </button>
            <button
              type="button"
              className={cn('h-14 rounded-xl font-bold text-xl transition-colors', mutedBg, 'text-foreground hover:bg-primary hover:text-primary-foreground')}
              onClick={() => handleKeypad('0')}
            >
              0
            </button>
            <button
              type="button"
              className={cn('h-14 rounded-xl font-bold text-xl transition-colors', mutedBg, 'text-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center')}
              onClick={() => handleKeypad('backspace')}
              aria-label="Backspace"
            >
              <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/></svg>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-muted/30 border-t border-border">
          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-primary text-primary-foreground text-xl font-bold py-5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
              onClick={onAddShot}
            >
              Next Shot
              <ArrowRight className="size-5" />
            </Button>
            {canHoleOut && (
              <Button
                variant="secondary"
                className="w-full py-5 text-lg font-bold rounded-xl"
                onClick={onHoleOut}
              >
                Hole Out
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Shot history */}
      <div className="flex flex-col gap-3">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] px-1">
          Shot History - Hole {currentHole.holeNumber}
        </h3>
        <div className="flex flex-col gap-2">
          {currentHole.shots.map((shot, idx) => {
            const toHoleDisplay = shot.lie === 'Green'
              ? `${Math.round(shot.startDistance * 3)}ft to hole`
              : `${Math.round(shot.startDistance)}y to hole`;
            return (
              <div
                key={idx}
                className={cn('flex items-center justify-between p-4 rounded-lg border', cardBg, sectionBorder)}
              >
                <div className="flex items-center gap-4">
                  <span className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm', mutedBg, 'text-foreground')}>
                    {shot.shotNumber}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{shot.lie === 'Sand' ? 'Bunker' : shot.lie}</span>
                    <span className="text-xs text-muted-foreground">
                      {shot.club ? clubLabel(shot.club) : '—'} • {toHoleDisplay}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => dispatch({ type: 'SET_ACTIVE_SHOT', payload: idx })}
                  aria-label="Edit shot"
                >
                  <Pencil className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
