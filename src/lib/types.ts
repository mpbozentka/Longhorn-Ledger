import { z } from 'zod';

export type Lie = 'Tee' | 'Fairway' | 'Rough' | 'Sand' | 'Green';

export const CLUBS = [
  'Dr', '3w', '5w', 
  '3 Hyb', '4 Hyb', '5 Hyb', '6 Hyb',
  '3i', '4i', '5i', '6i', '7i', '8i', '9i',
  'PW', 'GW', 'SW', 'LW',
  'Putter'
] as const;

export type Club = typeof CLUBS[number] | string;

export type Shot = {
  shotNumber: number;
  startDistance: number; // Always in yards
  lie: Lie;
  club?: Club;
  strokesGained?: number;
};

export type Hole = {
  holeNumber: number;
  par: number;
  yardage: number;
  shots: Shot[];
  isCompleted: boolean;
};

export type TeeBox =
  | 'Texas Tees'
  | 'Longhorn Orange'
  | 'Harvey Penick'
  | 'Longhorn White'
  | 'Morris Williams'
  | 'UT Orange (M)'
  | 'Ed White'
  | 'UT Orange (W)'
  | 'Betsy Rawls'
  | 'UT White';
  
export type Gender = 'Male' | 'Female';

export type RoundState = {
  golferName: string | null;
  gender: Gender;
  teeBox: TeeBox;
  holes: Hole[];
  currentHoleIndex: number;
  activeShotIndex: number; // The shot currently being viewed/edited
  isRoundCompleted: boolean;
};

export type TeeBoxInfo = {
  name: TeeBox;
  rating: number;
  slope: number;
};

// AI-related types
const LieEnum = z.enum(['Tee', 'Fairway', 'Rough', 'Sand', 'Green']);
const UnitsEnum = z.enum(['yards', 'feet']);

export const ShotCommandInputSchema = z.string();
export type ShotCommandInput = z.infer<typeof ShotCommandInputSchema>;

export const ShotCommandOutputSchema = z.object({
    lie: LieEnum.describe('The lie or surface the ball was on.'),
    distance: z.number().describe('The distance to the pin.'),
    units: UnitsEnum.describe('The unit of measurement for the distance.'),
    club: z.string().optional().describe('The club used for the shot.'),
});
export type ShotCommandOutput = z.infer<typeof ShotCommandOutputSchema>;
