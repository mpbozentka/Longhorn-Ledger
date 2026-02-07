'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useRound } from '@/context/round-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ChevronsRight, Save } from 'lucide-react';
import { exportRoundToCsv } from '@/lib/csv';
import type { Lie } from '@/lib/types';

type SGCategory = 'Tee' | 'Approach' | 'Short Game' | 'Putting';

const getCategory = (lie: Lie): SGCategory => {
    switch(lie) {
        case 'Tee':
            return 'Tee';
        case 'Fairway':
        case 'Rough':
            return 'Approach';
        case 'Sand':
            return 'Short Game';
        case 'Green':
            return 'Putting';
        default:
            return 'Approach';
    }
}

export function RoundSummary() {
  const { user, isSignedIn } = useUser();
  const { state, dispatch } = useRound();

  const handleExport = () => {
    exportRoundToCsv(state);
  };

  const handleSubmitRound = () => {
    if (!user?.id) return;
    const userId = user.id;
    // TODO: Send round to your database (e.g. POST /api/rounds with { userId, round: state })
    console.log('Submit round for user:', userId, state);
    // Example: await fetch('/api/rounds', { method: 'POST', body: JSON.stringify({ userId, round: state }) });
  };
  
  const handleNewRound = () => {
    dispatch({ type: 'RESET_ROUND' });
  }

  // Include all holes that have at least one shot
  const playedHoles = state.holes;

  const allShots = playedHoles.flatMap(hole => 
    hole.shots.filter(shot => shot.strokesGained !== undefined)
  );

  const sgByCategory = allShots.reduce((acc, shot) => {
    if (shot.lie) {
      const category = getCategory(shot.lie);
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += shot.strokesGained || 0;
    }
    return acc;
  }, {} as Record<SGCategory, number>);

  const totalSG = Object.values(sgByCategory).reduce((sum, val) => sum + val, 0);

  const totalScore = playedHoles.reduce((sum, hole) => {
      // Total strokes is shots.length - 1 if completed, else shots.length
      return sum + (hole.isCompleted ? hole.shots.length - 1 : hole.shots.length);
  }, 0);
  
  const totalPar = playedHoles.reduce((sum, hole) => {
    return sum + hole.par;
  }, 0);

  const scoreToPar = totalScore - totalPar;

  const summaryData: { category: SGCategory; strokesGained: number }[] = [
    { category: 'Tee', strokesGained: sgByCategory['Tee'] || 0 },
    { category: 'Approach', strokesGained: sgByCategory['Approach'] || 0 },
    { category: 'Short Game', strokesGained: sgByCategory['Short Game'] || 0 },
    { category: 'Putting', strokesGained: sgByCategory['Putting'] || 0 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Round Summary</CardTitle>
          <CardDescription>Well played, {state.golferName}!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Total Score</p>
                    <p className="text-2xl font-bold">{totalScore}</p>
                    <p className="text-xs text-muted-foreground">{playedHoles.length > 0 ? `${scoreToPar >= 0 ? '+' : ''}${scoreToPar} to Par` : '-' } ({playedHoles.length} holes)</p>
                </div>
                <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Total Strokes Gained</p>
                    <p className={`text-2xl font-bold ${totalSG > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalSG.toFixed(2)}
                    </p>
                     <p className="text-xs text-muted-foreground">vs. PGA Tour Pro</p>
                </div>
            </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Strokes Gained</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryData.map(({ category, strokesGained }) => (
                <TableRow key={category}>
                  <TableCell className="font-medium">{category}</TableCell>
                  <TableCell className={`text-right font-semibold ${strokesGained > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {strokesGained.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

            <div className="flex flex-col space-y-2 pt-4">
                {isSignedIn && (
                  <Button onClick={handleSubmitRound} disabled={playedHoles.length === 0}>
                    <Save className="mr-2 h-4 w-4" /> Submit Round
                  </Button>
                )}
                <Button onClick={handleNewRound}>
                    <ChevronsRight className="mr-2 h-4 w-4" /> Start New Round
                </Button>
                <Button onClick={handleExport} variant="outline" disabled={playedHoles.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Export to CSV
                </Button>
            </div>

        </CardContent>
      </Card>
    </div>
  );
}