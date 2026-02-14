'use client';

import React from 'react';
import { useRound } from '@/context/round-context';
import { ActiveShotEntry } from './active-shot-entry';
import { Button } from '@/components/ui/button';
import { ChevronRight, Flag, CheckCircle2 } from 'lucide-react';

export function HoleTracker() {
  const { state, dispatch } = useRound();
  const currentHole = state.holes[state.currentHoleIndex];
  const activeShotIndex = state.activeShotIndex;
  const activeShot = currentHole?.shots[activeShotIndex];

  if (!currentHole) return null;

  const handleAddShot = () => dispatch({ type: 'ADD_SHOT' });
  const handleHoleOut = () => {
    dispatch({ type: 'HOLE_OUT' });
    dispatch({ type: 'NEXT_HOLE' });
  };
  const handleNextHole = () => dispatch({ type: 'NEXT_HOLE' });

  const isLastPlayedHole = state.currentHoleIndex === state.holes.length - 1;
  const isHoledOut = currentHole.isCompleted;
  const canHoleOut =
    activeShot?.lie === 'Green' &&
    !isHoledOut &&
    activeShotIndex === currentHole.shots.length - 1;

  return (
    <div className="flex h-full flex-col min-h-screen bg-background">
      <main className="flex-1 flex justify-center py-8 px-4 lg:px-10 overflow-auto">
        {!isHoledOut ? (
          <ActiveShotEntry
            currentHole={currentHole}
            activeShot={activeShot!}
            activeShotIndex={activeShotIndex}
            onAddShot={handleAddShot}
            onHoleOut={handleHoleOut}
            canHoleOut={canHoleOut}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 max-w-[600px] w-full">
            <div className="bg-primary/10 p-6 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Hole Completed!</h2>
              <p className="text-muted-foreground text-lg">
                {currentHole.shots.length - 1} Strokes
              </p>
            </div>
            <div className="w-full space-y-2 pt-4">
              {!isLastPlayedHole ? (
                <Button onClick={handleNextHole} className="w-full h-12 text-lg">
                  <ChevronRight className="mr-2 h-5 w-5" /> Next Hole
                </Button>
              ) : (
                <Button
                  onClick={() => dispatch({ type: 'END_ROUND' })}
                  className="w-full h-12 text-lg"
                >
                  <Flag className="mr-2 h-5 w-5" /> End Round
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => dispatch({ type: 'SET_ACTIVE_SHOT', payload: 0 })}
                className="w-full"
              >
                Review Shots
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer brand */}
      <div className="py-6 text-center text-muted-foreground/60 shrink-0">
        <p className="text-xs font-bold tracking-widest uppercase">
          UT Golf Club - Member Tracking System
        </p>
      </div>
    </div>
  );
}
