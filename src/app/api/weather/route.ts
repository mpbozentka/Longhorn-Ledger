import { NextResponse } from 'next/server';

// Austin, TX (UT Golf Club)
const AUSTIN_LAT = 30.2672;
const AUSTIN_LON = -97.7431;

/** WMO weather code to short label (Open-Meteo uses WMO) */
const WEATHER_LABELS: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Drizzle',
  53: 'Drizzle',
  55: 'Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow',
  80: 'Light Showers',
  81: 'Showers',
  82: 'Heavy Showers',
  85: 'Snow Showers',
  86: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};

function getWeatherLabel(code: number): string {
  return WEATHER_LABELS[code] ?? 'Clear';
}

/** Degrees to compass (e.g. 160 -> SSE) */
function windDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const i = Math.round(deg / 22.5) % 16;
  return dirs[i] ?? 'N';
}

export async function GET() {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(AUSTIN_LAT));
    url.searchParams.set('longitude', String(AUSTIN_LON));
    url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m');

    const res = await fetch(url.toString(), { next: { revalidate: 600 } }); // cache 10 min
    if (!res.ok) throw new Error('Weather API error');

    const data = (await res.json()) as {
      current?: {
        temperature_2m: number;
        weather_code: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
      };
    };

    const cur = data?.current;
    if (!cur) throw new Error('No current weather');

    const tempF = Math.round((cur.temperature_2m * 9) / 5 + 32);
    const windMph = Math.round(cur.wind_speed_10m * 0.621371);

    return NextResponse.json({
      tempF,
      condition: getWeatherLabel(cur.weather_code),
      windMph,
      windDir: windDirection(cur.wind_direction_10m),
    });
  } catch (e) {
    console.error('Weather fetch failed:', e);
    return NextResponse.json(
      { error: 'Failed to load weather' },
      { status: 502 }
    );
  }
}
