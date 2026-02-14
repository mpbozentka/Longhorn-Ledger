# Longhorn Ledger

A golf round and **strokes gained** tracking app for **UT Golf Club**. Log shots by hole, track performance over time, and compare your game to benchmarks.

## Features

- **Sign in** — Clerk authentication (sign up / sign in).
- **Round setup** — Choose tee box, then start a round at UT Golf Club.
- **Shot entry** — Per hole: select lie (Tee, Fairway, Rough, Bunker, Green), club, and distance to hole; add shots or hole out.
- **Strokes gained** — Automatic SG calculation using a baseline lookup (by lie and distance).
- **Performance dashboard** — View trends over the last 20/50 rounds or full season: SG by category (Off-the-Tee, Approach, Around-Green, Putting), trend chart, and gap vs PGA Tour Pro (or Scratch / 5 handicap).
- **Round summary** — Review and save the round; rounds sync to Supabase so they’re available on any device.
- **Export** — Export round or dashboard data (e.g. CSV) where implemented.

## Tech stack

- **Next.js 15** (App Router, Turbopack)
- **React 19**
- **Clerk** — auth
- **Supabase** — rounds storage (server-side)
- **Tailwind CSS** + **Radix UI** (shadcn/ui-style components)
- **Recharts** — performance charts
- **Genkit** — optional AI flows (e.g. shot parsing)

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

## Setup

1. **Clone and install**

   ```bash
   cd "Longhorn Ledger"
   npm install
   ```

2. **Environment variables**

   Create a `.env.local` in the project root with:

   - **Clerk** (get from [Clerk Dashboard](https://dashboard.clerk.com)):
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
   - **Supabase** (get from your [Supabase](https://supabase.com) project → Settings → API):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`

   See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for detailed Supabase setup (create project, run `supabase/rounds-table.sql`, copy keys).

   - **Google AI (optional)** — for Genkit AI flows (e.g. voice shot parsing): get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey), then set `GEMINI_API_KEY` in `.env.local`.

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:9002](http://localhost:9002) (or the port shown in the terminal).

## Scripts

| Command           | Description                    |
|------------------|--------------------------------|
| `npm run dev`    | Start dev server (Turbopack)   |
| `npm run build`  | Production build               |
| `npm run start`  | Run production server         |
| `npm run lint`   | Run ESLint                     |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run genkit:dev` | Start Genkit dev server   |

## Project structure

- `src/app/` — Next.js App Router (page, layout, API routes for rounds).
- `src/components/` — UI: landing, round setup, hole tracker, active shot entry, dashboard (performance trends), round summary.
- `src/context/` — Round state (holes, shots, current hole, active shot).
- `src/lib/` — Types, course data (UT Golf Club), strokes-gained lookup, rounds storage (Supabase + local), demo data, CSV export.
- `src/ai/` — Genkit flows (e.g. shot command parsing).
- `supabase/` — SQL for `rounds` table.
- `docs/` — Blueprint and [Supabase setup](docs/SUPABASE_SETUP.md).

## Design

- **Primary:** UT Burnt Orange (`#BF5700`).
- **Background:** Off-white; dark mode supported via Tailwind.
- Mobile-friendly layout; shot entry and dashboard are responsive.

---

© UT Golf Club — Longhorn Ledger. Data can be synced with GHIN Index where configured.
