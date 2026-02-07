'use client';

import React from 'react';
import { useRound } from '@/context/round-context';
import { ShotCard } from './shot-card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Plus, Mic, ChevronLeft, ChevronRight, Flag, CheckCircle2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { parseShotCommand } from '@/ai/flows/parse-shot-command-flow';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';

export function HoleTracker() {
  const { state, dispatch } = useRound();
  const currentHole = state.holes[state.currentHoleIndex];
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const activeShotIndex = state.activeShotIndex;
  const activeShot = currentHole?.shots[activeShotIndex];

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
  } = useSpeechRecognition({
      onStop: async (finalTranscript: string) => {
          if (finalTranscript) {
              setIsProcessing(true);
              try {
                  const result = await parseShotCommand(finalTranscript);
                  
                  dispatch({ 
                    type: 'UPDATE_SHOT', 
                    payload: { 
                        shotIndex: activeShotIndex, 
                        shot: {
                            lie: result.lie,
                            startDistance: result.distance, 
                            club: result.club,
                            units: result.units
                        } 
                    } 
                });

                  toast({
                      title: "Shot Updated via Voice",
                      description: `Set Shot ${activeShotIndex + 1} to ${result.distance} ${result.units} from the ${result.lie}.`,
                  });
              } catch (e) {
                  console.error(e);
                  toast({
                      variant: 'destructive',
                      title: "Couldn't understand that",
                      description: "Sorry, I couldn't parse that command. Please try again.",
                  })
              } finally {
                  setIsProcessing(false);
              }
          }
      }
  });


  if (!currentHole) return null;

  const handleYardageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYardage = parseInt(e.target.value, 10);
    if (!isNaN(newYardage)) {
      dispatch({ type: 'UPDATE_YARDAGE', payload: newYardage });
    }
  };

  const handleAddShot = () => {
    dispatch({ type: 'ADD_SHOT' });
  };

  const handleHoleOut = () => {
    dispatch({ type: 'HOLE_OUT' });
    dispatch({ type: 'NEXT_HOLE' });
  };
  
  const handleNextHole = () => {
    dispatch({ type: 'NEXT_HOLE' });
  }

  const handlePreviousHole = () => {
    dispatch({ type: 'PREVIOUS_HOLE' });
  }

  const handleNextShot = () => {
    if (activeShotIndex < currentHole.shots.length - 1) {
      dispatch({ type: 'SET_ACTIVE_SHOT', payload: activeShotIndex + 1 });
    }
  };

  const handlePrevShot = () => {
    if (activeShotIndex > 0) {
      dispatch({ type: 'SET_ACTIVE_SHOT', payload: activeShotIndex - 1 });
    }
  };
  
  const isLastPlayedHole = state.currentHoleIndex === state.holes.length - 1;
  const isHoledOut = currentHole.isCompleted;
  const lastShot = currentHole.shots[currentHole.shots.length - 1];
  const canHoleOut = activeShot?.lie === 'Green' && !isHoledOut && activeShotIndex === currentHole.shots.length - 1;

  const handleMicClick = () => {
    if (isListening || isProcessing) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Progress percentage through the current hole's shots
  const progress = ((activeShotIndex + 1) / (currentHole.isCompleted ? currentHole.shots.length - 1 : currentHole.shots.length)) * 100;

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto h-full">
       <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-0 pb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePreviousHole} 
            disabled={state.currentHoleIndex === 0}
            className="rounded-full"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className='text-center flex-1'>
            <CardTitle className="text-xl font-bold">
              Hole {currentHole.holeNumber}
            </CardTitle>
            <div className='flex justify-center gap-4 text-sm text-muted-foreground'>
                <span>{currentHole.yardage} Yards</span>
                <span>Par {currentHole.par}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextHole} 
            disabled={isLastPlayedHole && !currentHole.isCompleted}
            className="rounded-full"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </CardHeader>
      </Card>

      <div className="px-1">
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {activeShot && ! (isHoledOut && activeShotIndex === currentHole.shots.length - 1) ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-bold">Shot {activeShot.shotNumber}</h2>
                <div className="flex gap-1">
                   <Button variant="outline" size="icon" onClick={handlePrevShot} disabled={activeShotIndex === 0} className="h-8 w-8 rounded-full">
                      <ChevronLeft className="h-4 w-4" />
                   </Button>
                   <Button variant="outline" size="icon" onClick={handleNextShot} disabled={activeShotIndex === currentHole.shots.length - 1} className="h-8 w-8 rounded-full">
                      <ChevronRight className="h-4 w-4" />
                   </Button>
                </div>
             </div>
            
            <ShotCard
              shot={activeShot}
              shotIndex={activeShotIndex}
              isHoleCompleted={currentHole.isCompleted}
              endDistance={activeShotIndex < currentHole.shots.length - 1 ? currentHole.shots[activeShotIndex + 1].startDistance : 0}
            />

            {activeShot.shotNumber === 1 && !currentHole.isCompleted && currentHole.shots.length === 1 && (
                 <div className="rounded-lg border bg-card p-4 flex items-center justify-between gap-2">
                    <label htmlFor="yardage" className="text-sm font-medium">Starting Yardage:</label>
                    <Input
                        id="yardage"
                        type="number"
                        value={currentHole.yardage}
                        onChange={handleYardageChange}
                        className="w-24 h-9"
                    />
                 </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in zoom-in-95 duration-300">
             <div className="bg-primary/10 p-6 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-primary" />
             </div>
             <div>
                <h2 className="text-2xl font-bold">Hole Completed!</h2>
                <p className="text-muted-foreground text-lg">{currentHole.shots.length - 1} Strokes</p>
             </div>
             
             <div className="w-full space-y-2 pt-4">
                {!isLastPlayedHole ? (
                  <Button onClick={handleNextHole} className="w-full h-12 text-lg">
                    <ChevronRight className="mr-2 h-5 w-5" /> Next Hole
                  </Button>
                ) : (
                  <Button onClick={() => dispatch({ type: 'END_ROUND' })} className="w-full h-12 text-lg">
                    <Flag className="mr-2 h-5 w-5" /> End Round
                  </Button>
                )}
                <Button variant="outline" onClick={() => dispatch({ type: 'SET_ACTIVE_SHOT', payload: 0 })} className="w-full">
                  Review Shots
                </Button>
             </div>
          </div>
        )}
      </div>
      
      {!currentHole.isCompleted && (
         <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm pt-4 pb-2 space-y-3">
            <div className="flex gap-3">
               <Button onClick={handleMicClick} variant={isListening ? 'destructive' : 'secondary'} size="lg" className="h-14 w-14 rounded-full shadow-lg" disabled={isProcessing}>
                  <Mic className={isListening ? 'animate-pulse' : ''} />
               </Button>
               
               <div className="flex-1 flex gap-2">
                 <Button
                   onClick={handleHoleOut}
                   disabled={!canHoleOut}
                   className="flex-1 h-14 text-lg font-bold"
                   variant="secondary"
                 >
                   <CheckCircle2 className="mr-2 h-5 w-5" /> Hole Out
                 </Button>
                 <Button onClick={handleAddShot} className="flex-1 h-14 text-lg font-bold">
                   <Plus className="mr-2 h-5 w-5" /> Next Shot
                 </Button>
               </div>
            </div>

            {isProcessing && <p className="text-center text-sm text-primary animate-pulse font-medium">AI is thinking...</p>}
            {isListening && <p className="text-center text-sm text-destructive animate-pulse font-medium">Listening to your command...</p>}
             {error && <p className="text-center text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
            {transcript && !isListening && !isProcessing && (
                <p className="text-center text-xs text-muted-foreground italic px-4 overflow-hidden truncate">"{transcript}"</p>
            )}
        </div>
      )}
    </div>
  );
}
