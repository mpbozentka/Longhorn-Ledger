'use client';

import React from 'react';
import { useRound } from '@/context/round-context';
import { ActiveShotEntry } from './active-shot-entry';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flag, CheckCircle2, Settings } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

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
  const handlePreviousHole = () => dispatch({ type: 'PREVIOUS_HOLE' });

  const isLastPlayedHole = state.currentHoleIndex === state.holes.length - 1;
  const isHoledOut = currentHole.isCompleted;
  const canHoleOut =
    activeShot?.lie === 'Green' &&
    !isHoledOut &&
    activeShotIndex === currentHole.shots.length - 1;

  return (
    <div className="flex h-full flex-col min-h-screen bg-background">
      {/* Header - matches shot input design */}
      <header className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-10 bg-card shrink-0">
        <div className="flex items-center gap-3 text-primary">
          <div className="size-8 shrink-0">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden>
              <path fillRule="evenodd" clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" />
            </svg>
          </div>
          <h2 className="text-foreground text-xl font-bold leading-tight tracking-tight">UT Golf Club</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg size-10 bg-muted hover:bg-muted/80"
              onClick={handlePreviousHole}
              disabled={state.currentHoleIndex === 0}
              aria-label="Previous hole"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <span className="text-sm font-medium tabular-nums min-w-[4ch] text-center text-foreground">
              {currentHole.holeNumber} / 18
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg size-10 bg-muted hover:bg-muted/80"
              onClick={handleNextHole}
              disabled={isLastPlayedHole && !currentHole.isCompleted}
              aria-label="Next hole"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="rounded-lg size-10 bg-muted hover:bg-muted/80" aria-label="Settings">
            <Settings className="size-5" />
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

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
