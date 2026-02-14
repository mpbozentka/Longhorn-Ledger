'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { getRounds, computeRoundStats, getSgByCategoryForRound, type SavedRound, type SGCategory } from '@/lib/rounds-storage';
import { getFIRForRounds, getGIRForRounds, getPuttsForRounds } from '@/lib/round-stats';
import { getDemoRoundState } from '@/lib/demo-round';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { CLUBS, BLANK_DISTANCE } from '@/lib/types';

const RANGE_OPTIONS = [5, 20, 50, 'season'] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

const CATEGORY_LABELS: Record<SGCategory, string> = {
  Tee: 'Off-the-Tee',
  Approach: 'Approach',
  'Short Game': 'Around-Green',
  Putting: 'Putting',
};
const CATEGORY_ORDER: SGCategory[] = ['Tee', 'Approach', 'Short Game', 'Putting'];

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
  const [range, setRange] = useState<RangeOption>(5);
  const [baseline, setBaseline] = useState<'pro' | 'scratch' | '5hcp'>('pro');
  const [chartView, setChartView] = useState<'category' | 'trends'>('category');

  const currentRounds = useMemo(
    () => (useDemoStats ? demoRounds : rounds),
    [useDemoStats, demoRounds, rounds]
  );
  const displayedRounds = useMemo(() => {
    if (range === 'season') return currentRounds;
    const n = range === 5 ? 5 : range === 20 ? 20 : 50;
    return currentRounds.slice(0, n);
  }, [currentRounds, range]);
  const safeSelectedIndex =
    selectedRoundIndex !== null && selectedRoundIndex >= 0 && selectedRoundIndex < currentRounds.length
      ? selectedRoundIndex
      : null;
  const roundsForTables = useMemo(
    () => (safeSelectedIndex !== null ? [currentRounds[safeSelectedIndex]] : displayedRounds).filter(Boolean),
    [currentRounds, safeSelectedIndex, displayedRounds]
  );

  const avgByCategory = useMemo(() => {
    const sum: Record<SGCategory, number> = { Tee: 0, Approach: 0, 'Short Game': 0, Putting: 0 };
    if (displayedRounds.length === 0) return sum;
    for (const r of displayedRounds) {
      const cat = getSgByCategoryForRound(r.roundState);
      for (const k of CATEGORY_ORDER) sum[k] += cat[k];
    }
    for (const k of CATEGORY_ORDER) sum[k] = Math.round((sum[k] / displayedRounds.length) * 100) / 100;
    return sum;
  }, [displayedRounds]);

  const firAgg = useMemo(
    () => getFIRForRounds(displayedRounds),
    [displayedRounds]
  );
  const girAgg = useMemo(
    () => getGIRForRounds(displayedRounds),
    [displayedRounds]
  );
  const puttsAgg = useMemo(
    () => getPuttsForRounds(displayedRounds),
    [displayedRounds]
  );

  const totalDeltaVsPro = useMemo(() => {
    const total = CATEGORY_ORDER.reduce((s, k) => s + avgByCategory[k], 0);
    return Math.round(total * 10) / 10;
  }, [avgByCategory]);

  const chartData = useMemo(() => {
    const reversed = [...displayedRounds].reverse();
    return reversed.map((r, i) => {
      const roundIndex = displayedRounds.length - 1 - i;
      const cat = getSgByCategoryForRound(r.roundState);
      return {
        round: `R${i + 1}`,
        strokesGained: Math.round(r.totalSG * 100) / 100,
        ott: Math.round(cat.Tee * 100) / 100,
        app: Math.round((cat.Approach + cat['Short Game']) * 100) / 100,
        putt: Math.round(cat.Putting * 100) / 100,
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
          if (shot.strokesGained === undefined || shot.lie === 'Green' || shot.startDistance === BLANK_DISTANCE) continue;
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
          if (shot.lie !== 'Green' || shot.strokesGained === undefined || shot.startDistance === 0 || shot.startDistance === BLANK_DISTANCE) continue;
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

  const generateDemoRounds = useCallback((): SavedRound[] => {
    const baseDate = new Date();
    return Array.from({ length: 20 }, (_, i) => {
      const state = getDemoRoundState(i % 10);
      const { totalScore, totalSG } = computeRoundStats(state);
      const date = new Date(baseDate);
      date.setDate(date.getDate() - (19 - i));
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
    setDemoRounds((prev) => (prev.length === 20 ? prev : generateDemoRounds()));
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

  const rangeLabel = range === 'season' ? 'Season' : `Last ${range}`;
  const worstCategory = useMemo(() => {
    let worst: SGCategory = 'Approach';
    let min = 0;
    for (const k of CATEGORY_ORDER) {
      if (avgByCategory[k] < min) {
        min = avgByCategory[k];
        worst = k;
      }
    }
    return worst;
  }, [avgByCategory]);

  return (
    <div className="flex flex-col min-h-screen w-full max-w-[1200px] mx-auto">
      <header className="flex items-center justify-between border-b border-border px-4 md:px-6 py-3 bg-card sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-8 text-primary shrink-0">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path clipRule="evenodd" fillRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">UT Golf Club</h2>
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden lg:flex items-center gap-6">
            <span className="text-muted-foreground text-sm font-medium">Dashboard</span>
            <span className="text-muted-foreground text-sm font-medium">Rounds</span>
            <span className="text-primary text-sm font-bold border-b-2 border-primary">Performance</span>
            <span className="text-muted-foreground text-sm font-medium">Goals</span>
          </nav>
          <Button size="sm" variant="default" className="hidden sm:inline-flex min-w-[100px]">
            Export Data
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Performance Trends</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!loading && (
              <div className="flex rounded-lg border border-border bg-muted/50 p-1 gap-0.5">
                {(RANGE_OPTIONS as unknown as (5 | 20 | 50 | 'season')[]).map((r) => (
                  <button
                    key={String(r)}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${range === r ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-primary'
                      }`}
                  >
                    {r === 'season' ? 'Season' : `Last ${r}`}
                  </button>
                ))}
              </div>
            )}
            {!loading && (
              <Button
                variant={useDemoStats ? 'secondary' : 'outline'}
                size="sm"
                onClick={useDemoStats ? handleSwitchToMyStats : handleSwitchToDemo}
              >
                {useDemoStats ? 'My stats' : 'Demo'}
              </Button>
            )}
            {useDemoStats && (
              <Button variant="ghost" size="sm" onClick={handleReplaceDemoRounds}>
                New demo rounds
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground py-8">Loading your rounds…</p>
        ) : displayedRounds.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {displayName}</CardTitle>
              <CardDescription>
                {useDemoStats
                  ? 'Demo stats — click Demo to load sample rounds.'
                  : 'Start a round and submit it to see your Performance Trends here.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Card className="mb-6 md:mb-8 border-border shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">Strokes Gained</CardTitle>
                    <CardDescription>
                      {chartView === 'category'
                        ? `Average SG per round ${range !== 'season' ? `(last ${range} rounds)` : '(season)'}`
                        : 'Strokes gained per round. Click a point to select that round.'}
                    </CardDescription>
                  </div>
                  <div className="flex rounded-lg border border-border bg-muted/50 p-1 gap-0.5 w-fit">
                    <button
                      type="button"
                      onClick={() => setChartView('category')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${chartView === 'category' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-primary'}`}
                    >
                      By Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartView('trends')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${chartView === 'trends' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-primary'}`}
                    >
                      Over Time
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {chartView === 'category' ? (
                  <ChartContainer
                    config={{
                      sg: { label: 'Strokes Gained', color: 'hsl(var(--primary))' },
                    }}
                    className="h-[240px] w-full"
                  >
                    <BarChart
                      data={CATEGORY_ORDER.map((cat) => ({
                        name: CATEGORY_LABELS[cat],
                        sg: avgByCategory[cat] ?? 0,
                      }))}
                      margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
                    >
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                      <YAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => (v >= 0 ? `+${v}` : `${v}`)} domain={['auto', 'auto']} width={36} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(v) => [(v as number) >= 0 ? `+${(v as number).toFixed(2)}` : (v as number).toFixed(2), 'Strokes Gained']} />} />
                      <Bar dataKey="sg" radius={[4, 4, 4, 4]} maxBarSize={48}>
                        {CATEGORY_ORDER.map((cat) => {
                          const val = avgByCategory[cat] ?? 0;
                          return (
                            <Cell
                              key={cat}
                              fill={val >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.7)'}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <>
                    <div
                      ref={chartContainerRef}
                      onClick={handleChartClick}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
                      aria-label="Click to select a round"
                    >
                      <ChartContainer
                        config={{
                          strokesGained: { label: 'Total SG', color: 'hsl(var(--primary))' },
                          ott: { label: 'OTT', color: 'rgb(59 130 246)' },
                          app: { label: 'APP', color: 'rgb(34 197 94)' },
                          putt: { label: 'PUTT', color: 'rgb(168 85 247)' },
                        }}
                        className="h-[280px] w-full"
                      >
                        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="round" tickLine={false} axisLine={false} tickMargin={8} />
                          <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => (v >= 0 ? `+${v}` : `${v}`)} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="strokesGained" stroke="hsl(var(--primary))" strokeWidth={2} dot={({ cx, cy, payload, index }) => {
                            const dataPoint = (index != null && chartData[index]) ? chartData[index] : payload;
                            const roundIndex = dataPoint?.roundIndex;
                            return (
                              <g key={`dot-${roundIndex ?? index}`} data-round-index={roundIndex} onClick={(e) => { e.stopPropagation(); const ri = e.currentTarget.getAttribute('data-round-index'); if (ri != null) setSelectedRoundIndex(Number(ri)); }} style={{ cursor: 'pointer' }}>
                                <circle cx={cx} cy={cy} r={6} fill="hsl(var(--primary))" stroke={safeSelectedIndex === roundIndex ? 'var(--foreground)' : 'transparent'} strokeWidth={2} />
                              </g>
                            );
                          }} connectNulls />
                          <Line type="monotone" dataKey="ott" stroke="rgb(59 130 246)" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 2" />
                          <Line type="monotone" dataKey="app" stroke="rgb(34 197 94)" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 2" />
                          <Line type="monotone" dataKey="putt" stroke="rgb(168 85 247)" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 2" />
                        </LineChart>
                      </ChartContainer>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {safeSelectedIndex !== null
                        ? `Selected: Round ${(safeSelectedIndex ?? 0) + 1} — ${displayedRounds[safeSelectedIndex] ? new Date(displayedRounds[safeSelectedIndex].date).toLocaleDateString() : ''}`
                        : `${displayedRounds.length} round${displayedRounds.length === 1 ? '' : 's'} (click chart to select one)`}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
              <Card className="border-border shadow-sm">
                <CardContent className="p-5 flex flex-col gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fairways in Regulation</span>
                  <p className="text-2xl md:text-3xl font-black text-foreground tabular-nums">
                    {firAgg.roundCount === 0 ? '—' : `${firAgg.percentage}%`}
                  </p>
                  {firAgg.roundCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {firAgg.hit}/{firAgg.total} over {firAgg.roundCount} round{firAgg.roundCount === 1 ? '' : 's'}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardContent className="p-5 flex flex-col gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Greens in Regulation</span>
                  <p className="text-2xl md:text-3xl font-black text-foreground tabular-nums">
                    {girAgg.roundCount === 0 ? '—' : `${girAgg.averagePerRound} per round`}
                  </p>
                  {girAgg.roundCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {girAgg.totalGIR} total in {girAgg.roundCount} round{girAgg.roundCount === 1 ? '' : 's'}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardContent className="p-5 flex flex-col gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Putts</span>
                  <p className="text-2xl md:text-3xl font-black text-foreground tabular-nums">
                    {puttsAgg.roundCount === 0 ? '—' : `${puttsAgg.averagePutts} Avg Putts`}
                  </p>
                  {puttsAgg.roundCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {puttsAgg.totalPutts} total in {puttsAgg.roundCount} round{puttsAgg.roundCount === 1 ? '' : 's'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Target Baseline</CardTitle>
                  <CardDescription>Compare your performance against benchmark skill levels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(['pro', 'scratch', '5hcp'] as const).map((b) => (
                    <label
                      key={b}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${baseline === b ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                        }`}
                    >
                      <div>
                        <span className="font-bold text-foreground">
                          {b === 'pro' ? 'PGA Tour Pro' : b === 'scratch' ? 'Scratch (0 HDCP)' : '5 Handicap'}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {b === 'pro' ? 'The gold standard' : b === 'scratch' ? 'Competitive amateur' : 'Club champion level'}
                        </span>
                      </div>
                      <input type="radio" name="baseline" checked={baseline === b} onChange={() => setBaseline(b)} className="text-primary focus:ring-primary h-5 w-5" />
                    </label>
                  ))}
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Relative Gap vs Pro</CardTitle>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Delta: {totalDeltaVsPro >= 0 ? '+' : ''}{totalDeltaVsPro} Strokes</span>
                </CardHeader>
                <CardContent className="space-y-6">
                  {CATEGORY_ORDER.map((cat) => {
                    const gap = avgByCategory[cat];
                    const isNeg = gap < 0;
                    const pct = Math.min(50, Math.abs(gap) * 12);
                    return (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-muted-foreground">{CATEGORY_LABELS[cat]}</span>
                          <span className={`font-bold tabular-nums ${gap >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {gap >= 0 ? '+' : ''}{gap.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full bg-muted h-3 rounded-full overflow-hidden flex">
                          <div className="w-1/2 border-r border-border flex flex-row-reverse">
                            {isNeg && <div className="bg-red-500/80 h-full rounded-l-full" style={{ width: `${pct * 2}%` }} />}
                          </div>
                          <div className="w-1/2 flex">
                            {!isNeg && <div className="bg-green-500/80 h-full rounded-r-full" style={{ width: `${pct * 2}%` }} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-4 border-t border-border flex items-center gap-3">
                    <span className="text-primary shrink-0">💡</span>
                    <p className="text-sm text-muted-foreground">
                      Focus on <span className="font-bold text-foreground">{CATEGORY_LABELS[worstCategory]} (e.g. key distances)</span> to see the biggest gains against your target baseline.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Detailed stats</CardTitle>
                <CardDescription>
                  {safeSelectedIndex !== null ? 'This round' : `All ${displayedRounds.length} round${displayedRounds.length === 1 ? '' : 's'}`} — by distance, putting, and club.
                </CardDescription>
                {safeSelectedIndex !== null && (
                  <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={() => setSelectedRoundIndex(null)}>
                    ← Back to all rounds
                  </Button>
                )}
              </CardHeader>
              <CardContent>
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
                            <TableCell className={`text-right font-semibold tabular-nums ${strokesGained > 0 ? 'text-green-600' : strokesGained < 0 ? 'text-red-600' : ''}`}>
                              {strokesGained >= 0 ? '+' : ''}{strokesGained.toFixed(2)}
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
                            <TableCell className={`text-right font-semibold tabular-nums ${strokesGained > 0 ? 'text-green-600' : strokesGained < 0 ? 'text-red-600' : ''}`}>
                              {strokesGained >= 0 ? '+' : ''}{strokesGained.toFixed(2)}
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
                            <TableCell colSpan={2} className="text-muted-foreground text-center py-4">No club data in selected round(s).</TableCell>
                          </TableRow>
                        ) : (
                          sgByClubTable.map(({ label, strokesGained }) => (
                            <TableRow key={label}>
                              <TableCell className="font-medium">{label}</TableCell>
                              <TableCell className={`text-right font-semibold tabular-nums ${strokesGained > 0 ? 'text-green-600' : strokesGained < 0 ? 'text-red-600' : ''}`}>
                                {strokesGained >= 0 ? '+' : ''}{strokesGained.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}

        <footer className="text-center text-muted-foreground text-xs pb-8">
          <p>© {new Date().getFullYear()} UT Golf Club Longhorn Ledger. Data synced with GHIN Index.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a className="hover:text-primary transition-colors underline" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors underline" href="#">Support</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
