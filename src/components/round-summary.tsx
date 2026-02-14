'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRound } from '@/context/round-context';
import { Button } from '@/components/ui/button';
import { Save, ChevronDown, TrendingUp, Home } from 'lucide-react';
import { saveRound } from '@/lib/rounds-storage';
import type { Lie } from '@/lib/types';
import { BLANK_DISTANCE } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { COURSE_DATA } from '@/lib/course-data';
import { getFIRForRound, getGIRForRound, getPuttsForRound } from '@/lib/round-stats';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { generateRoundInsight, type RoundInsightInput } from '@/ai/flows/round-insight-flow';

type SGCategory = 'Tee' | 'Approach' | 'Short Game' | 'Putting';

const getCategory = (lie: Lie): SGCategory => {
  switch (lie) {
    case 'Tee': return 'Tee';
    case 'Fairway':
    case 'Rough': return 'Approach';
    case 'Sand': return 'Short Game';
    case 'Green': return 'Putting';
    default: return 'Approach';
  }
};

const CATEGORY_LABELS: Record<SGCategory, string> = {
  Tee: 'Off the Tee',
  Approach: 'Approach',
  'Short Game': 'Around Green',
  Putting: 'Putting',
};

const COURSE_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuChNS_uiLU6a-DpKy-iXHKEoo4OZJIuDuLOk57MTMRq2B_lZcbRY1jgq99JdnNi6LUrvv7gk3g7FYZjxYjXZlJpSpCgjY21kfA3UeF9MDHcpfqze7aah3xJCbU-vXvBgBd56lQDkldhXHZSYnYlJCk0xNxnkEMva6BSYlRUaxScr_zFnJ7a_wEoR9MFHTq0Kj5kXVmcrm2SFUcT6e0WrWSL10UXBg3ayOtb_-nkzQONMUcDpINoFeIXj7modKOlFu6mPiZBBu1Dl3HM';

function getScoreStatus(score: number, par: number): { label: string; className: string } {
  const diff = score - par;
  if (diff <= -2) return { label: 'EAGLE', className: 'bg-primary/20 text-primary' };
  if (diff === -1) return { label: 'BIRDIE', className: 'bg-primary/10 text-primary' };
  if (diff === 0) return { label: 'PAR', className: 'bg-muted text-foreground' };
  if (diff === 1) return { label: 'BOGEY', className: 'bg-muted-foreground/10 text-muted-foreground' };
  return { label: `+${diff}`, className: 'bg-destructive/10 text-destructive' };
}

export function RoundSummary() {
  const { user, isSignedIn } = useUser();
  const { state, dispatch } = useRound();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showAllHoles, setShowAllHoles] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);

  const playedHoles = state.holes;
  const allShots = playedHoles.flatMap((hole) =>
    hole.shots.filter((shot) => shot.strokesGained !== undefined)
  );

  const sgByCategory = useMemo(() => {
    const acc: Record<SGCategory, number> = {
      Tee: 0,
      Approach: 0,
      'Short Game': 0,
      Putting: 0,
    };
    allShots.forEach((shot) => {
      if (shot.lie) {
        const cat = getCategory(shot.lie);
        acc[cat] += shot.strokesGained ?? 0;
      }
    });
    return acc;
  }, [allShots]);

  const totalSG = useMemo(
    () => Object.values(sgByCategory).reduce((s, v) => s + v, 0),
    [sgByCategory]
  );

  const totalScore = playedHoles.reduce(
    (sum, hole) => sum + (hole.isCompleted ? hole.shots.length - 1 : hole.shots.length),
    0
  );
  const totalPar = playedHoles.reduce((sum, hole) => sum + hole.par, 0);

  const holeRows = useMemo(() => {
    return playedHoles.map((hole) => {
      const score = hole.isCompleted ? hole.shots.length - 1 : hole.shots.length;
      const holeSG = hole.shots.reduce((s, shot) => s + (shot.strokesGained ?? 0), 0);
      const status = getScoreStatus(score, hole.par);
      return { hole: hole.holeNumber, par: hole.par, score, status, holeSG };
    });
  }, [playedHoles]);

  const fir = useMemo(() => getFIRForRound(state), [state]);
  const gir = useMemo(() => getGIRForRound(state), [state]);
  const putts = useMemo(() => getPuttsForRound(state), [state]);

  const displayRows = showAllHoles ? holeRows : holeRows.slice(0, 5);

  const roundInsight = useMemo(() => {
    const facts: { fact: string; priority: number }[] = [];
    const oddHoles = holeRows.filter((r) => r.hole % 2 === 1);
    const evenHoles = holeRows.filter((r) => r.hole % 2 === 0);
    const par3s = holeRows.filter((r) => r.par === 3);
    const par5s = holeRows.filter((r) => r.par === 5);

    if (oddHoles.length >= 3 && oddHoles.every((r) => r.score === r.par)) {
      facts.push({ fact: 'You made par on every odd-numbered hole today.', priority: 90 });
    }
    if (evenHoles.length >= 3 && evenHoles.every((r) => r.score === r.par)) {
      facts.push({ fact: 'You made par on every even-numbered hole today.', priority: 90 });
    }
    if (par3s.length >= 2 && par3s.every((r) => r.score <= r.par - 1)) {
      facts.push({ fact: 'You birdied or better on every par 3.', priority: 95 });
    }
    if (par5s.length >= 2 && par5s.every((r) => r.score <= r.par - 1)) {
      facts.push({ fact: 'You went under par on every par 5.', priority: 92 });
    }

    const putts = allShots.filter((s) => s.lie === 'Green' && s.startDistance > 0 && s.startDistance !== BLANK_DISTANCE);
    const puttFeet = putts.map((s) => s.startDistance * 3);
    if (puttFeet.length >= 3 && puttFeet.every((ft) => ft <= 6)) {
      facts.push({ fact: 'You made every putt from inside 6 feet.', priority: 88 });
    }
    if (puttFeet.length >= 2 && puttFeet.every((ft) => ft <= 10)) {
      facts.push({ fact: 'All of your putts today started from 10 feet or in.', priority: 75 });
    }

    let onePuttCount = 0;
    playedHoles.forEach((hole) => {
      const puttsOnHole = hole.shots.filter((s) => s.lie === 'Green' && s.startDistance !== 0);
      if (puttsOnHole.length === 1) onePuttCount++;
    });
    if (onePuttCount >= 5 && playedHoles.length >= 9) {
      facts.push({ fact: `You one-putted ${onePuttCount} greens today.`, priority: 85 });
    }

    let threePuttCount = 0;
    playedHoles.forEach((hole) => {
      const puttsOnHole = hole.shots.filter((s) => s.lie === 'Green' && s.startDistance !== 0);
      if (puttsOnHole.length >= 3) threePuttCount++;
    });
    if (threePuttCount === 0 && playedHoles.length >= 5) {
      facts.push({ fact: 'No three-putts this round.', priority: 82 });
    }

    const sandShots = allShots.filter((s) => s.lie === 'Sand');
    if (sandShots.length === 0 && playedHoles.length >= 6) {
      facts.push({ fact: "You stayed out of the sand all round.", priority: 70 });
    }

    const bestCat = (['Tee', 'Approach', 'Short Game', 'Putting'] as SGCategory[]).reduce((a, b) =>
      (sgByCategory[a] ?? 0) >= (sgByCategory[b] ?? 0) ? a : b
    );
    const bestVal = sgByCategory[bestCat] ?? 0;
    if (bestVal > 0.5 && Object.values(sgByCategory).filter((v) => (v ?? 0) > 0).length === 1) {
      facts.push({
        fact: `Your standout today was ${CATEGORY_LABELS[bestCat].toLowerCase()} — you gained ${bestVal.toFixed(1)} strokes there.`,
        priority: 65,
      });
    }

    const frontNine = holeRows.filter((r) => r.hole <= 9);
    const backNine = holeRows.filter((r) => r.hole > 9);
    if (frontNine.length >= 5 && frontNine.every((r) => r.score <= r.par)) {
      facts.push({ fact: 'You were par or better on every hole on the front nine.', priority: 87 });
    }
    if (backNine.length >= 5 && backNine.every((r) => r.score <= r.par)) {
      facts.push({ fact: 'You were par or better on every hole on the back nine.', priority: 87 });
    }

    if (facts.length > 0) {
      facts.sort((a, b) => b.priority - a.priority);
      return facts[0].fact;
    }
    const toPar = totalScore - totalPar;
    const toParStr = toPar >= 0 ? `+${toPar}` : `${toPar}`;
    if (totalSG >= 0) {
      return `You gained ${totalSG.toFixed(1)} strokes vs. baseline. Score: ${totalScore} (${toParStr} to par).`;
    }
    return `You were ${Math.abs(totalSG).toFixed(1)} strokes below baseline. Score: ${totalScore} (${toParStr} to par).`;
  }, [holeRows, playedHoles, allShots, sgByCategory, totalSG, totalScore, totalPar]);

  useEffect(() => {
    if (playedHoles.length < 2) {
      setAiInsight(null);
      return;
    }
    setAiInsight(null);
    const putts = allShots.filter((s) => s.lie === 'Green' && s.startDistance > 0 && s.startDistance !== BLANK_DISTANCE);
    const puttDistancesFeet = putts.map((s) => s.startDistance * 3);
    let onePuttCount = 0;
    let threePuttCount = 0;
    playedHoles.forEach((hole) => {
      const puttsOnHole = hole.shots.filter((s) => s.lie === 'Green' && s.startDistance !== 0);
      if (puttsOnHole.length === 1) onePuttCount++;
      if (puttsOnHole.length >= 3) threePuttCount++;
    });
    const sandShotCount = allShots.filter((s) => s.lie === 'Sand').length;
    const payload: RoundInsightInput = {
      holeByHole: holeRows.map((r) => ({ hole: r.hole, par: r.par, score: r.score, strokesGained: r.holeSG })),
      strokesGainedByCategory: { ...sgByCategory },
      totalScore,
      totalPar,
      totalStrokesGained: totalSG,
      puttCount: putts.length,
      onePuttCount,
      threePuttCount,
      sandShotCount,
      puttDistancesFeet,
    };
    let cancelled = false;
    setAiInsightLoading(true);
    generateRoundInsight(payload)
      .then((result) => {
        if (!cancelled && result) setAiInsight(result);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAiInsightLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [holeRows, playedHoles, allShots, sgByCategory, totalSG, totalScore, totalPar]);

  const displayInsight = aiInsightLoading ? 'Generating insight…' : (aiInsight ?? roundInsight);

  const handleSubmitRound = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await saveRound(state);
      toast({ title: 'Round saved', description: 'Your round has been saved to your stats.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Could not save round',
        description: e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewRound = () => dispatch({ type: 'RESET_ROUND' });

  const roundDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground">
      <main className="flex-1 py-8">
        <div className="flex flex-col max-w-[1200px] mx-auto px-4 md:px-10">
          {/* Hero */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-xl bg-card shadow-sm border border-border mb-8">
            <div className="flex flex-col gap-2">
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <a className="hover:text-primary" href="#">Rounds</a>
                <span className="text-xs">/</span>
                <span>{COURSE_DATA.name}</span>
              </nav>
              <h1 className="text-4xl font-black leading-tight tracking-tight">UT Golf Club Summary</h1>
              <p className="text-muted-foreground text-base">
                {roundDate} • Par {totalPar} • {state.teeBox}
              </p>
            </div>
            <div className="flex flex-row flex-nowrap items-stretch gap-3 min-w-0 shrink w-full md:w-auto md:max-w-[420px]">
              <div className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 px-4 py-3 md:px-6 md:py-4 bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-primary text-xs md:text-sm font-bold uppercase tracking-wider">Total SG</p>
                <div className="flex flex-col items-center gap-0.5">
                  <span className={cn('text-3xl md:text-5xl font-black', totalSG >= 0 ? 'text-primary' : 'text-muted-foreground')}>
                    {totalSG >= 0 ? '+' : ''}{totalSG.toFixed(2)}
                  </span>
                  <span className="text-green-600 text-xs md:text-sm font-bold flex items-center gap-0.5">
                    <TrendingUp className="size-3 md:size-4" /> vs. scratch
                  </span>
                </div>
              </div>
              <div className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 px-4 py-3 md:px-6 md:py-4 bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-primary text-xs md:text-sm font-bold uppercase tracking-wider">Total Score</p>
                <div className="flex flex-col items-center gap-0.5 md:flex-row md:items-baseline md:gap-2">
                  <span className="text-3xl md:text-5xl font-black text-foreground">{totalScore}</span>
                  <span className="text-muted-foreground text-xs md:text-sm font-bold">
                    ({totalScore - totalPar >= 0 ? '+' : ''}{totalScore - totalPar} to par)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FIR / GIR / Putts */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Fairways</p>
              <p className="text-xl font-bold tabular-nums text-foreground">
                {fir.total > 0 ? `${fir.percentage}% (${fir.hit}/${fir.total})` : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Greens</p>
              <p className="text-xl font-bold tabular-nums text-foreground">{gir.hit} / {gir.total}</p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Putts</p>
              <p className="text-xl font-bold tabular-nums text-foreground">{putts} Putts</p>
            </div>
          </div>

          {/* Category breakdown - bar chart */}
          <section className="mb-10">
            <h3 className="text-[22px] font-bold leading-tight tracking-tight mb-4">Category Breakdown</h3>
            <div className="rounded-xl p-6 bg-card border border-border">
              <ChartContainer
                config={{
                  sg: { label: 'Strokes Gained', color: 'hsl(var(--primary))' },
                }}
                className="h-[240px] w-full"
              >
                <BarChart
                  data={(['Tee', 'Approach', 'Short Game', 'Putting'] as SGCategory[]).map((cat) => ({
                    name: CATEGORY_LABELS[cat],
                    sg: sgByCategory[cat] ?? 0,
                  }))}
                  margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
                >
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                  <YAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => (v >= 0 ? `+${v}` : `${v}`)} domain={['auto', 'auto']} width={36} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => [(v as number) >= 0 ? `+${(v as number).toFixed(2)}` : (v as number).toFixed(2), 'Strokes Gained']} />} />
                  <Bar dataKey="sg" radius={[4, 4, 4, 4]} maxBarSize={48}>
                    {(['Tee', 'Approach', 'Short Game', 'Putting'] as SGCategory[]).map((_, idx) => {
                      const sg = sgByCategory[['Tee', 'Approach', 'Short Game', 'Putting'][idx] as SGCategory] ?? 0;
                      return (
                        <Cell
                          key={idx}
                          fill={sg >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.7)'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </section>

          {/* Hole-by-hole */}
          <section className="mb-10 bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold">Hole-by-Hole Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-xs font-bold uppercase">
                    <th className="px-6 py-3">Hole</th>
                    <th className="px-6 py-3">Par</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Strokes Gained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayRows.map((row) => (
                    <tr key={row.hole} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{row.hole}</td>
                      <td className="px-6 py-4">{row.par}</td>
                      <td className={cn('px-6 py-4', row.score < row.par && 'font-bold text-primary')}>{row.score}</td>
                      <td className="px-6 py-4">
                        <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold', row.status.className)}>
                          {row.status.label}
                        </span>
                      </td>
                      <td className={cn('px-6 py-4 text-right font-bold', row.holeSG >= 0 ? 'text-primary' : 'text-muted-foreground')}>
                        {row.holeSG >= 0 ? '+' : ''}{row.holeSG.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {holeRows.length > 5 && (
              <div className="p-4 bg-muted/30 flex justify-center">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1" onClick={() => setShowAllHoles((v) => !v)}>
                  {showAllHoles ? 'Show less' : `View all ${holeRows.length} holes`}
                  <ChevronDown className={cn('size-4 transition-transform', showAllHoles && 'rotate-180')} />
                </Button>
              </div>
            )}
          </section>

          {/* Round insight + map */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4 p-6 bg-card rounded-xl border border-border">
              <h3 className="text-lg font-bold">Round Insight</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {displayInsight}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                {isSignedIn && (
                  <Button onClick={handleSubmitRound} disabled={playedHoles.length === 0 || isSaving}>
                    <Save className="mr-2 size-4" /> {isSaving ? 'Saving…' : 'Submit Round'}
                  </Button>
                )}
                <Button onClick={handleNewRound} variant="secondary">
                  Start New Round
                </Button>
              </div>
            </div>
            <div className="relative min-h-[200px] rounded-xl overflow-hidden border border-border">
              <img src={COURSE_IMAGE} alt="UT Golf Club course" className="w-full h-full object-cover min-h-[200px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div className="text-white">
                  <p className="text-xs font-bold uppercase opacity-80">Course Location</p>
                  <p className="text-sm">{COURSE_DATA.name}, Austin TX</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-3 gap-2" onClick={() => dispatch({ type: 'RESET_ROUND' })}>
              <Home className="size-4" /> Return to Home
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-10 px-4 md:px-6 bg-card">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-primary font-black text-xl">UTGC</span>
            <span className="text-muted-foreground text-xs">© {new Date().getFullYear()} University of Texas Golf Club.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a className="hover:text-primary" href="#">Privacy</a>
            <a className="hover:text-primary" href="#">Terms</a>
            <a className="hover:text-primary" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
