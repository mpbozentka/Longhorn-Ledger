'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { getRounds, computeRoundStats, type SavedRound } from '@/lib/rounds-storage';
import { getDemoRoundState } from '@/lib/demo-round';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CLUBS } from '@/lib/types';

export function Dashboard() {
  const { user } = useUser();
  const [rounds, setRounds] = useState<SavedRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setRounds([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getRounds()
      .then((data) => {
        if (!cancelled) setRounds(data);
      })
      .catch(() => {
        if (!cancelled) setRounds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(null);
  const [useDemoStats, setUseDemoStats] = useState(false);
  const [demoRounds, setDemoRounds] = useState<SavedRound[]>([]);

  const currentRounds = useMemo(
    () => (useDemoStats ? demoRounds : rounds),
    [useDemoStats, demoRounds, rounds]
  );
  const displayedRounds = useMemo(() => currentRounds.slice(0, 10), [currentRounds]);
  const safeSelectedIndex =
    selectedRoundIndex !== null && selectedRoundIndex >= 0 && selectedRoundIndex < currentRounds.length
      ? selectedRoundIndex
      : null;
  const roundsForTables = useMemo(
    () => (safeSelectedIndex !== null ? [currentRounds[safeSelectedIndex]] : displayedRounds).filter(Boolean),
    [currentRounds, safeSelectedIndex, displayedRounds]
  );

  const chartData = useMemo(() => {
    const reversed = [...displayedRounds].reverse();
    return reversed.map((r, i) => {
      const roundIndex = displayedRounds.length - 1 - i;
      return {
        round: `Round ${i + 1}`,
        strokesGained: Math.round(r.totalSG * 100) / 100,
        date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        roundIndex,
      };
    });
  }, [displayedRounds]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const handleChartClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!chartData.length || !chartContainerRef.current) return;
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const index = Math.min(chartData.length - 1, Math.floor(ratio * chartData.length));
      const roundIndex = chartData[index]?.roundIndex;
      if (roundIndex !== undefined) setSelectedRoundIndex(roundIndex);
    },
    [chartData]
  );

  const sgByDistanceTable = useMemo(() => {
    const buckets: Record<string, number> = {
      'Off the tee': 0,
      '0–50 yds': 0,
      '50–100 yds': 0,
      '100–150 yds': 0,
      '150–200 yds': 0,
      '200–250 yds': 0,
      '250–300 yds': 0,
    };
    for (const round of roundsForTables) {
      for (const hole of round.roundState.holes) {
        for (const shot of hole.shots) {
          if (shot.strokesGained === undefined || shot.lie === 'Green') continue;
          if (shot.lie === 'Tee') {
            buckets['Off the tee'] += shot.strokesGained;
            continue;
          }
          const d = shot.startDistance;
          if (d <= 50) buckets['0–50 yds'] += shot.strokesGained;
          else if (d <= 100) buckets['50–100 yds'] += shot.strokesGained;
          else if (d <= 150) buckets['100–150 yds'] += shot.strokesGained;
          else if (d <= 200) buckets['150–200 yds'] += shot.strokesGained;
          else if (d <= 250) buckets['200–250 yds'] += shot.strokesGained;
          else if (d <= 300) buckets['250–300 yds'] += shot.strokesGained;
        }
      }
    }
    return Object.entries(buckets).map(([label, sg]) => ({
      label,
      strokesGained: Math.round(sg * 100) / 100,
    }));
  }, [roundsForTables]);

  const sgPuttingByDistanceTable = useMemo(() => {
    const buckets: Record<string, number> = {
      '0–5 ft': 0,
      '5–10 ft': 0,
      '10–15 ft': 0,
      '15–20 ft': 0,
      '20–30 ft': 0,
      '30–40 ft': 0,
      '40–50 ft': 0,
      '50–60 ft': 0,
    };
    for (const round of roundsForTables) {
      for (const hole of round.roundState.holes) {
        for (const shot of hole.shots) {
          if (shot.lie !== 'Green' || shot.strokesGained === undefined || shot.startDistance === 0) continue;
          const feet = shot.startDistance * 3;
          if (feet <= 5) buckets['0–5 ft'] += shot.strokesGained;
          else if (feet <= 10) buckets['5–10 ft'] += shot.strokesGained;
          else if (feet <= 15) buckets['10–15 ft'] += shot.strokesGained;
          else if (feet <= 20) buckets['15–20 ft'] += shot.strokesGained;
          else if (feet <= 30) buckets['20–30 ft'] += shot.strokesGained;
          else if (feet <= 40) buckets['30–40 ft'] += shot.strokesGained;
          else if (feet <= 50) buckets['40–50 ft'] += shot.strokesGained;
          else if (feet <= 60) buckets['50–60 ft'] += shot.strokesGained;
        }
      }
    }
    return Object.entries(buckets).map(([label, sg]) => ({
      label,
      strokesGained: Math.round(sg * 100) / 100,
    }));
  }, [roundsForTables]);

  const sgByClubTable = useMemo(() => {
    const byClub: Record<string, number> = {};
    for (const round of roundsForTables) {
      for (const hole of round.roundState.holes) {
        for (const shot of hole.shots) {
          if (shot.strokesGained === undefined || !shot.club) continue;
          const club = shot.club;
          byClub[club] = (byClub[club] ?? 0) + shot.strokesGained;
        }
      }
    }
    const order = [...CLUBS];
    const rows = Object.entries(byClub).map(([club, sg]) => ({
      club,
      strokesGained: Math.round(sg * 100) / 100,
      sortKey: order.indexOf(club) >= 0 ? order.indexOf(club) : order.length,
    }));
    rows.sort((a, b) => a.sortKey - b.sortKey || a.club.localeCompare(b.club));
    return rows.map(({ club, strokesGained }) => ({ label: club, strokesGained }));
  }, [roundsForTables]);

  const displayName = user?.firstName ?? user?.fullName ?? 'there';
  const [seeding, setSeeding] = useState(false);

  const generateDemoRounds = useCallback((): SavedRound[] => {
    const baseDate = new Date();
    return Array.from({ length: 10 }, (_, i) => {
      const state = getDemoRoundState(i);
      const { totalScore, totalSG } = computeRoundStats(state);
      const date = new Date(baseDate);
      date.setDate(date.getDate() - (9 - i));
      return {
        date: date.toISOString(),
        totalScore,
        totalSG,
        roundState: state,
      };
    });
  }, []);

  const handleSwitchToDemo = useCallback(() => {
    setUseDemoStats(true);
    setDemoRounds((prev) => (prev.length === 10 ? prev : generateDemoRounds()));
    setSelectedRoundIndex(null);
  }, [generateDemoRounds]);

  const handleSwitchToMyStats = useCallback(() => {
    setUseDemoStats(false);
    setSelectedRoundIndex(null);
  }, []);

  const handleReplaceDemoRounds = useCallback(() => {
    setDemoRounds(generateDemoRounds());
    setSelectedRoundIndex(null);
  }, [generateDemoRounds]);

  const handleLoadDemoRounds = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/rounds/seed', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await getRounds();
      setRounds(data);
    } catch {
      // ignore
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {displayName}</CardTitle>
          <CardDescription>
            {loading
              ? 'Loading your rounds…'
              : useDemoStats
                ? 'Viewing demo stats (10 sample rounds). Switch to see your logged rounds.'
                : rounds.length === 0
                  ? 'Start a round and submit it to see your strokes gained trend here.'
                  : `You have ${rounds.length} round${rounds.length === 1 ? '' : 's'} logged.`}
          </CardDescription>
        </CardHeader>
        {!loading && (
          <CardContent className="pt-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={useDemoStats ? 'secondary' : 'outline'}
                size="sm"
                onClick={useDemoStats ? handleSwitchToMyStats : handleSwitchToDemo}
              >
                {useDemoStats ? 'View my stats' : 'View demo stats'}
              </Button>
              {useDemoStats && (
                <Button variant="ghost" size="sm" onClick={handleReplaceDemoRounds}>
                  Replace with 10 new demo rounds
                </Button>
              )}
            </div>
            {!useDemoStats && (
              <button
                type="button"
                onClick={handleLoadDemoRounds}
                disabled={seeding}
                className="text-sm text-primary hover:underline font-medium"
              >
                {seeding
                  ? 'Loading…'
                  : rounds.length === 0
                    ? 'Load 10 demo rounds into your account (overwrites saved rounds)'
                    : 'Replace my saved rounds with 10 demo rounds'}
              </button>
            )}
          </CardContent>
        )}
        {chartData.length > 0 && (
          <CardContent>
            {safeSelectedIndex !== null && (
              <Button
                variant="outline"
                size="sm"
                className="mb-4"
                onClick={() => setSelectedRoundIndex(null)}
              >
                ← Back to all displayed rounds
              </Button>
            )}
            <p className="text-sm font-medium text-muted-foreground mb-4">
              {safeSelectedIndex !== null
                ? `Round ${chartData.find((d) => d.roundIndex === safeSelectedIndex)?.round ?? ''} — strokes gained`
                : `Strokes gained — ${displayedRounds.length} round${displayedRounds.length === 1 ? '' : 's'} (click chart or a point to view one)`}
            </p>
            <div
              ref={chartContainerRef}
              onClick={handleChartClick}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
              }}
              aria-label="Click to select a round"
            >
              <ChartContainer
                config={{
                  strokesGained: {
                    label: 'Strokes Gained',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="h-[240px] w-full"
              >
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="round"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => (v >= 0 ? `+${v}` : `${v}`)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="strokesGained"
                  stroke="var(--color-strokesGained)"
                  strokeWidth={2}
                  dot={({ cx, cy, payload, index }) => {
                    const dataPoint = (index != null && chartData[index]) ? chartData[index] : payload;
                    const roundIndex = dataPoint?.roundIndex;
                    return (
                      <g
                        key={index != null ? `dot-${index}` : `dot-${roundIndex ?? '?'}`}
                        role="button"
                        tabIndex={0}
                        data-round-index={roundIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          const ri = e.currentTarget.getAttribute('data-round-index');
                          if (ri != null) setSelectedRoundIndex(Number(ri));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const ri = e.currentTarget.getAttribute('data-round-index');
                            if (ri != null) setSelectedRoundIndex(Number(ri));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="var(--color-strokesGained)"
                          stroke={safeSelectedIndex === roundIndex ? 'var(--foreground)' : 'transparent'}
                          strokeWidth={2}
                        />
                      </g>
                    );
                  }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-4 mb-2">
              {safeSelectedIndex !== null ? 'This round' : `All ${displayedRounds.length} displayed round${displayedRounds.length === 1 ? '' : 's'}`} — switch tabs to view different stats
            </p>
            <Tabs defaultValue="by-distance" className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="by-distance">By distance</TabsTrigger>
                <TabsTrigger value="putting">Putting</TabsTrigger>
                <TabsTrigger value="by-club">By club</TabsTrigger>
              </TabsList>
              <TabsContent value="by-distance">
                <Table key={`sg-distance-${safeSelectedIndex ?? 'all'}`}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distance to hole</TableHead>
                      <TableHead className="text-right">Strokes gained</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sgByDistanceTable.map(({ label, strokesGained }) => (
                      <TableRow key={label}>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${
                            strokesGained > 0 ? 'text-green-600' : strokesGained < 0 ? 'text-red-600' : ''
                          }`}
                        >
                          {strokesGained >= 0 ? '+' : ''}
                          {strokesGained.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="putting">
                <Table key={`sg-putting-${safeSelectedIndex ?? 'all'}`}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distance to hole</TableHead>
                      <TableHead className="text-right">Strokes gained</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sgPuttingByDistanceTable.map(({ label, strokesGained }) => (
                      <TableRow key={label}>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${
                            strokesGained > 0 ? 'text-green-600' : strokesGained < 0 ? 'text-red-600' : ''
                          }`}
                        >
                          {strokesGained >= 0 ? '+' : ''}
                          {strokesGained.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="by-club">
                <Table key={`sg-club-${safeSelectedIndex ?? 'all'}`}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club</TableHead>
                      <TableHead className="text-right">Strokes gained</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sgByClubTable.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-muted-foreground text-center py-4">
                          No club data in selected round(s). Log clubs on shots to see strokes gained by club.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sgByClubTable.map(({ label, strokesGained }) => (
                        <TableRow key={label}>
                          <TableCell className="font-medium">{label}</TableCell>
                          <TableCell
                            className={`text-right font-semibold tabular-nums ${
                              strokesGained > 0 ? 'text-green-600' : strokesGained < 0 ? 'text-red-600' : ''
                            }`}
                          >
                            {strokesGained >= 0 ? '+' : ''}
                            {strokesGained.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
