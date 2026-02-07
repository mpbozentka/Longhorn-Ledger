'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useRound } from '@/context/round-context';
import { LoginScreen } from './login-screen';
import { LandingScreen } from './landing-screen';
import { Dashboard } from './dashboard';
import { HoleTracker } from './hole-tracker';
import { Button } from './ui/button';
import { RoundSummary } from './round-summary';

export function MainApp() {
  const { isSignedIn } = useUser();
  const { state, dispatch } = useRound();
  const [isClient, setIsClient] = React.useState(false);
  const [showStartRoundForm, setShowStartRoundForm] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleEndRound = () => {
    dispatch({ type: 'END_ROUND' });
  };

  const handleNewRound = () => {
    dispatch({ type: 'RESET_ROUND' });
  };

  const renderContent = () => {
    if (!isClient) {
      return null;
    }
    if (state.isRoundCompleted) {
      return <RoundSummary />;
    }
    if (!state.golferName) {
      if (isSignedIn) {
        if (showStartRoundForm) {
          return (
            <LoginScreen
              showBack
              onCancel={() => setShowStartRoundForm(false)}
              onStartRound={() => setShowStartRoundForm(false)}
            />
          );
        }
        return <Dashboard />;
      }
      return <LandingScreen />;
    }
    return <HoleTracker />;
  };

  const showStartNewRoundButton =
    isClient &&
    isSignedIn &&
    ((!showStartRoundForm && !state.golferName) || state.isRoundCompleted);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground px-4">
      <header className="flex w-full max-w-md flex-col items-center pt-6 pb-4">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">The Longhorn Ledger</h1>
          <div className="flex items-center gap-2">
            {showStartNewRoundButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  state.isRoundCompleted ? handleNewRound() : setShowStartRoundForm(true)
                }
              >
                Start new round
              </Button>
            )}
            {isClient && state.golferName && !state.isRoundCompleted && (
              <>
                <Button variant="ghost" size="sm" onClick={handleNewRound}>
                  Reset
                </Button>
                <Button variant="outline" size="sm" onClick={handleEndRound}>
                  End
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="w-full max-w-md flex-1 pb-8">
        {renderContent()}
      </main>
    </div>
  );
}