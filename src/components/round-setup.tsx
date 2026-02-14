'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRound } from '@/context/round-context';
import { COURSE_DATA, TEE_BOX_DATA, getTotalYardsForTee, getCoursePar } from '@/lib/course-data';
import type { TeeBox } from '@/lib/types';
import { Goal, MapPin, CheckCircle, Sun, PlayCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type WeatherData = {
  tempF: number;
  condition: string;
  windMph: number;
  windDir: string;
};

const COURSE_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDjXDAbeKbjOFCcSwBQ5cI1tOHfTHqOGutCVCCd8xEIBj8aT2nVY0T2iv6o2_MmxVPotewVQv7Ahd-ZGMndDkL7Ju-qi6EvS6P4m4mQMywRP7N6S9kSZMqRC6OX0IWhYanw8k667hJhQlJIXF2ca40Ju_C99wgF5MufwOR6nsNlfPPrH2sZNDL0RM4FB_X2Gn3kjAGozq4D62HWWCoNP3LEuFs-pYaFS0v_J6b9gcaAndFNuDdsTfQ6X9tWGadMHIb3291-iGKX8q_';

/** Tee boxes to show on round setup (design shows 3: Elite, Intermediate, Club). */
const FEATURED_TEES: { tee: TeeBox; tier: string }[] = [
  { tee: 'Texas Tees', tier: 'Elite' },
  { tee: 'Longhorn Orange', tier: 'Intermediate' },
  { tee: 'Longhorn White', tier: 'Club' },
];

type RoundSetupProps = {
  onCancel?: () => void;
  onStartRound?: () => void;
};

const FALLBACK_WEATHER: WeatherData = {
  tempF: 84,
  condition: 'Sunny',
  windMph: 12,
  windDir: 'SSE',
};

export function RoundSetup({ onCancel, onStartRound }: RoundSetupProps) {
  const { user } = useUser();
  const { dispatch } = useRound();
  const [selectedTee, setSelectedTee] = useState<TeeBox>('Longhorn White');
  const [useLiveWeather, setUseLiveWeather] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    if (!useLiveWeather) {
      setWeather(null);
      setWeatherError(false);
      return;
    }
    let cancelled = false;
    setWeatherLoading(true);
    setWeatherError(false);
    fetch('/api/weather')
      .then((res) => {
        if (!res.ok) throw new Error('Weather failed');
        return res.json();
      })
      .then((data: WeatherData) => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setWeatherError(true);
      })
      .finally(() => {
        if (!cancelled) setWeatherLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [useLiveWeather]);

  const displayWeather = useLiveWeather
    ? (weather ?? (weatherError ? FALLBACK_WEATHER : null))
    : FALLBACK_WEATHER;
  const showLiveIndicator = useLiveWeather && weather && !weatherError;

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.fullName ||
    'Golfer';
  const coursePar = getCoursePar();

  const handleStartRound = () => {
    dispatch({
      type: 'START_ROUND',
      payload: {
        golferName: displayName,
        gender: 'Male',
        teeBox: selectedTee,
      },
    });
    onStartRound?.();
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-foreground">
      {/* Header */}
      <header className="bg-primary px-4 py-4 flex items-center justify-between shadow-md md:px-10">
        <div className="flex items-center gap-3 text-primary-foreground">
          <div className="size-8 flex items-center justify-center">
            <Goal className="size-8" />
          </div>
          <h1 className="text-xl font-bold leading-tight tracking-tight uppercase">
            Longhorn Ledger
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-white/20"
              onClick={onCancel}
            >
              <ArrowLeft className="size-4 mr-1" />
              Back
            </Button>
          )}
          <div className="hidden md:flex flex-col items-end text-primary-foreground/90">
            <span className="text-xs font-semibold uppercase opacity-80">Member</span>
            <span className="text-sm font-medium">{displayName}</span>
          </div>
          {user?.imageUrl && (
            <div className="rounded-full border-2 border-white/30 overflow-hidden size-9 bg-muted">
              <img
                src={user.imageUrl}
                alt=""
                className="size-full object-cover"
              />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-8 flex flex-col items-center md:px-10 max-w-[1000px] w-full mx-auto">
        {/* Hero */}
        <div className="flex flex-col mb-8 w-full">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Round Setup</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" />
            <p className="text-sm font-medium uppercase tracking-wider">
              {COURSE_DATA.name} • Austin, TX
            </p>
          </div>
        </div>

        {/* Course visual */}
        <div className="relative w-full h-[240px] rounded-xl overflow-hidden mb-10 shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          <img
            src={COURSE_IMAGE}
            alt="UT Golf Club championship course"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-6 left-6 z-20">
            <p className="text-white text-2xl font-bold">Championship Course</p>
            <p className="text-white/80 text-sm">
              Par {coursePar} | {getTotalYardsForTee('Texas Tees').toLocaleString()} Yards from Tips
            </p>
          </div>
        </div>

        {/* Step 1: Tee box */}
        <section className="mb-10 w-full">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center size-8 bg-primary rounded-full text-primary-foreground text-sm font-bold">
              1
            </span>
            <h3 className="text-xl font-bold">Select Tee Box</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURED_TEES.map(({ tee, tier }) => {
              const info = TEE_BOX_DATA.find((t) => t.name === tee);
              const yards = getTotalYardsForTee(tee);
              const isSelected = selectedTee === tee;
              return (
                <button
                  key={tee}
                  type="button"
                  onClick={() => setSelectedTee(tee)}
                  className={cn(
                    'relative flex flex-col p-6 rounded-xl shadow-sm cursor-pointer text-left transition-colors',
                    'border-2 bg-card',
                    isSelected
                      ? 'border-primary ring-4 ring-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 text-primary">
                      <CheckCircle className="size-6" />
                    </div>
                  )}
                  <span
                    className={cn(
                      'font-bold text-xs uppercase tracking-widest mb-1',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {tier}
                  </span>
                  <h4 className="text-xl font-bold mb-1">{tee.replace(' (M)', '').replace(' (W)', '')}</h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    {yards.toLocaleString()} Yards
                    {info ? ` | ${info.rating} / ${info.slope}` : ''}
                  </p>
                  <div className="mt-auto flex items-center gap-2">
                    <div
                      className={cn(
                        'size-3 rounded-full',
                        tier === 'Elite' && 'bg-primary',
                        tier === 'Intermediate' && 'bg-orange-500',
                        tier === 'Club' && 'bg-muted-foreground/50 border border-border'
                      )}
                    />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {tier === 'Elite' && 'Burnt Orange Markers'}
                      {tier === 'Intermediate' && 'Standard Orange Markers'}
                      {tier === 'Club' && 'White Forward Markers'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Conditions */}
        <section className="mb-12 w-full">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center size-8 bg-primary rounded-full text-primary-foreground text-sm font-bold">
              2
            </span>
            <h3 className="text-xl font-bold">Conditions</h3>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Sun className="size-8" />
              </div>
              <div>
                <p className="font-bold text-lg">
                  Current Weather: Austin, TX
                  {showLiveIndicator && (
                    <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                      Live
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground">
                  {weatherLoading && !displayWeather ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-4 animate-spin" />
                      Loading…
                    </span>
                  ) : displayWeather ? (
                    `${displayWeather.tempF}°F • ${displayWeather.windMph}mph ${displayWeather.windDir} • ${displayWeather.condition}`
                  ) : (
                    '—'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Use Live Weather</span>
              <Switch
                checked={useLiveWeather}
                onCheckedChange={setUseLiveWeather}
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="flex flex-col gap-4 py-8 border-t border-border w-full">
          <Button
            size="lg"
            className="w-full py-6 text-xl font-bold rounded-xl shadow-xl flex items-center justify-center gap-3"
            onClick={handleStartRound}
          >
            <PlayCircle className="size-6" />
            START ROUND
          </Button>
          <p className="text-center text-muted-foreground text-sm">
            Round will be recorded as:{' '}
            <span className="font-bold text-foreground">Tournament Play</span>
          </p>
        </div>
      </main>

      {/* Decorative */}
      <div className="hidden lg:block fixed -bottom-20 -right-20 opacity-5 pointer-events-none">
        <Goal className="size-[400px]" />
      </div>
    </div>
  );
}
