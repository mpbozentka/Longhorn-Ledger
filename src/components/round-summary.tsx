'use client';

import React, { useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRound } from '@/context/round-context';
import { Button } from '@/components/ui/button';
import { Download, Save, ChevronDown, Bell, Settings, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { exportRoundToCsv } from '@/lib/csv';
import { saveRound } from '@/lib/rounds-storage';
import type { Lie } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { UserButton } from '@clerk/nextjs';
import { COURSE_DATA } from '@/lib/course-data';
import { cn } from '@/lib/utils';

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

  const displayRows = showAllHoles ? holeRows : holeRows.slice(0, 5);

  const handleExport = () => exportRoundToCsv(state);

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

  const barScale = 2; // ±2 strokes for full bar width

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 bg-card md:px-6">
        <div className="flex items-center gap-3 text-primary">
          <svg className="size-6" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" />
          </svg>
          <h2 className="text-lg font-bold leading-tight tracking-tight">UT Golf Club Stats</h2>
        </div>
        <div className="flex flex-1 justify-end gap-2 md:gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Dashboard</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Rounds</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Practice</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Profile</a>
          </nav>
          <Button variant="ghost" size="icon" className="rounded-lg size-10" aria-label="Notifications">
            <Bell className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-lg size-10" aria-label="Settings">
            <Settings className="size-5" />
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

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
            <div className="flex flex-col items-end gap-1 px-8 py-4 bg-primary/10 rounded-xl border border-primary/20 min-w-[200px]">
              <p className="text-primary text-sm font-bold uppercase tracking-wider">Total Strokes Gained</p>
              <div className="flex items-baseline gap-2">
                <span className={cn('text-5xl font-black', totalSG >= 0 ? 'text-primary' : 'text-muted-foreground')}>
                  {totalSG >= 0 ? '+' : ''}{totalSG.toFixed(2)}
                </span>
                <span className="text-green-600 text-sm font-bold flex items-center gap-0.5">
                  <TrendingUp className="size-4" /> vs. scratch
                </span>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <section className="mb-10">
            <h3 className="text-[22px] font-bold leading-tight tracking-tight mb-4">Category Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['Tee', 'Approach', 'Short Game', 'Putting'] as SGCategory[]).map((cat) => {
                const sg = sgByCategory[cat] ?? 0;
                const isPositive = sg >= 0;
                const halfPct = Math.min(50, (Math.abs(sg) / barScale) * 50);
                return (
                  <div
                    key={cat}
                    className="flex flex-col gap-4 rounded-xl p-6 bg-card border border-border"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground text-sm font-bold uppercase">{CATEGORY_LABELS[cat]}</p>
                      <span className={cn('font-bold text-lg', isPositive ? 'text-primary' : 'text-muted-foreground')}>
                        {sg >= 0 ? '+' : ''}{sg.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden relative">
                      {isPositive ? (
                        <div className="absolute left-1/2 h-full bg-primary rounded-r-full" style={{ width: `${halfPct}%` }} />
                      ) : (
                        <div className="absolute right-1/2 h-full bg-muted-foreground rounded-l-full" style={{ width: `${halfPct}%` }} />
                      )}
                      <div className="absolute left-1/2 w-0.5 h-full bg-foreground z-10 -translate-x-px" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {isPositive ? (
                        <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                      ) : (
                        <AlertCircle className="size-4 text-primary shrink-0" />
                      )}
                      <span>{isPositive ? 'Gaining vs. baseline' : 'Room to improve'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Hole-by-hole */}
          <section className="mb-10 bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold">Hole-by-Hole Performance</h3>
              <Button variant="ghost" size="sm" className="text-primary font-bold gap-2" onClick={handleExport} disabled={playedHoles.length === 0}>
                <Download className="size-4" /> Export CSV
              </Button>
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
                {totalSG >= 0
                  ? `You gained ${totalSG.toFixed(1)} strokes vs. baseline this round. Total score: ${totalScore} (${totalScore - totalPar >= 0 ? '+' : ''}${totalScore - totalPar} to par).`
                  : `You were ${Math.abs(totalSG).toFixed(1)} strokes below baseline. Total score: ${totalScore} (${totalScore - totalPar >= 0 ? '+' : ''}${totalScore - totalPar} to par).`}
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
