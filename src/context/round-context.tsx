'use client';

import React, { createContext, useReducer, useContext, useEffect, type ReactNode } from 'react';
import type { RoundState, Hole, Shot, Lie, TeeBox, Gender, Club } from '@/lib/types';
import { BLANK_DISTANCE } from '@/lib/types';
import { getExpectedStrokes } from '@/lib/strokes-gained';
import { COURSE_DATA } from '@/lib/course-data';

const LOCAL_STORAGE_KEY = 'longhorn-links-round-v3';

const getInitialHole = (holeIndex: number, teeBox: TeeBox): Hole => {
  const holeData = COURSE_DATA.holes[holeIndex];
  const yardage = holeData.teeBoxes[teeBox];
  return {
    holeNumber: holeIndex + 1,
    par: holeData.par,
    yardage: yardage,
    shots: [
      { shotNumber: 1, startDistance: yardage, lie: 'Tee', club: 'Dr' }
    ],
    isCompleted: false,
  }
}

const emptyState: RoundState = {
  golferName: null,
  gender: 'Male',
  teeBox: 'Longhorn White',
  holes: [],
  currentHoleIndex: 0,
  activeShotIndex: 0,
  isRoundCompleted: false,
};

const calculateStrokesGainedForHole = (hole: Hole, gender: Gender): Hole => {
  if (hole.shots.length < 2) return { ...hole, shots: hole.shots.map(s => ({ ...s, strokesGained: undefined })) };

  const shotsWithSG = hole.shots.map((shot, index) => {
    if (shot.startDistance === 0) return shot;
    if (shot.startDistance === BLANK_DISTANCE) return { ...shot, strokesGained: undefined };
    if (index === hole.shots.length - 1 && !hole.isCompleted) return shot;

    const nextShot = hole.shots[index + 1];
    if (nextShot && nextShot.startDistance === BLANK_DISTANCE) return { ...shot, strokesGained: undefined };

    const startDist = shot.lie === 'Green' ? shot.startDistance * 3 : shot.startDistance;
    const startSG = getExpectedStrokes(shot.lie, startDist, gender);

    let endSG = 0;

    if (nextShot && nextShot.startDistance > 0) {
      const endDist = nextShot.lie === 'Green' ? nextShot.startDistance * 3 : nextShot.startDistance;
      endSG = getExpectedStrokes(nextShot.lie, endDist, gender);
    } else if (!nextShot && !hole.isCompleted) {
      return { ...shot, strokesGained: undefined };
    }

    const strokesGained = startSG - endSG - 1;
    return { ...shot, strokesGained };
  });

  return { ...hole, shots: shotsWithSG };
};


type Action =
  | { type: 'START_ROUND'; payload: { golferName: string; gender: Gender; teeBox: TeeBox } }
  | { type: 'UPDATE_YARDAGE'; payload: number }
  | { type: 'ADD_SHOT' }
  | { type: 'UPDATE_SHOT'; payload: { shotIndex: number, shot: Partial<Shot> & { units?: 'yards' | 'feet' } } }
  | { type: 'HOLE_OUT' }
  | { type: 'NEXT_HOLE' }
  | { type: 'PREVIOUS_HOLE' }
  | { type: 'SET_ACTIVE_SHOT'; payload: number }
  | { type: 'REMOVE_SHOT'; payload: number }
  | { type: 'END_ROUND' }
  | { type: 'RESET_ROUND' }
  | { type: 'LOAD_STATE'; payload: RoundState };

const roundReducer = (state: RoundState, action: Action): RoundState => {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'START_ROUND': {
      const { golferName, gender, teeBox } = action.payload;
      const firstHole = getInitialHole(0, teeBox);
      return {
        ...emptyState,
        golferName,
        gender,
        teeBox,
        holes: [firstHole],
        currentHoleIndex: 0,
        activeShotIndex: 0,
        isRoundCompleted: false,
      };
    }

    case 'UPDATE_YARDAGE': {
      if (state.isRoundCompleted || state.holes[state.currentHoleIndex]?.shots.length > 1) {
        return state;
      }
      const newHoles = [...state.holes];
      const currentHole = { ...newHoles[state.currentHoleIndex] };
      currentHole.yardage = action.payload;
      if (currentHole.shots.length === 1) {
        currentHole.shots[0].startDistance = action.payload;
      }
      newHoles[state.currentHoleIndex] = currentHole;
      return { ...state, holes: newHoles };
    }

    case 'ADD_SHOT': {
      const newHoles = [...state.holes];
      let currentHole = { ...newHoles[state.currentHoleIndex] };
      const lastShot = currentHole.shots[currentHole.shots.length - 1];

      const newShot: Shot = {
        shotNumber: currentHole.shots.length + 1,
        lie: lastShot.lie === 'Green' ? 'Green' : 'Fairway',
        startDistance: BLANK_DISTANCE,
        club: lastShot.lie === 'Green' ? 'Putter' : undefined,
      };

      currentHole.shots = [...currentHole.shots, newShot];
      currentHole = calculateStrokesGainedForHole(currentHole, state.gender);
      newHoles[state.currentHoleIndex] = currentHole;
      return {
        ...state,
        holes: newHoles,
        activeShotIndex: currentHole.shots.length - 1
      };
    }

    case 'UPDATE_SHOT': {
      const { shotIndex, shot } = action.payload;
      const newHoles = [...state.holes];
      let currentHole = { ...newHoles[state.currentHoleIndex] };
      const newShots = [...currentHole.shots];

      let updatedShotData = { ...newShots[shotIndex], ...shot };

      if (shot.startDistance !== undefined) {
        const distNum = typeof shot.startDistance === 'string' ? parseFloat(shot.startDistance) : shot.startDistance;
        if (!isNaN(distNum)) {
          if (shot.units) {
            updatedShotData.startDistance = shot.units === 'feet' ? distNum / 3 : distNum;
          } else {
            updatedShotData.startDistance = distNum;
          }
        }
      }

      newShots[shotIndex] = updatedShotData;
      currentHole.shots = newShots;
      currentHole = calculateStrokesGainedForHole(currentHole, state.gender);

      newHoles[state.currentHoleIndex] = currentHole;
      return { ...state, holes: newHoles };
    }

    case 'REMOVE_SHOT': {
      const shotIndex = action.payload;
      const newHoles = [...state.holes];
      const currentHole = { ...newHoles[state.currentHoleIndex] };
      if (currentHole.shots.length <= 1 || shotIndex < 0 || shotIndex >= currentHole.shots.length) {
        return state;
      }
      const newShots = currentHole.shots
        .filter((_, i) => i !== shotIndex)
        .map((shot, i) => ({ ...shot, shotNumber: i + 1 }));
      currentHole.shots = newShots;
      if (currentHole.shots.every((s) => s.startDistance !== 0)) {
        currentHole.isCompleted = false;
      }
      const updatedHole = calculateStrokesGainedForHole(currentHole, state.gender);
      newHoles[state.currentHoleIndex] = updatedHole;
      let newActiveIndex = state.activeShotIndex;
      if (state.activeShotIndex === shotIndex) {
        newActiveIndex = Math.max(0, shotIndex - 1);
      } else if (state.activeShotIndex > shotIndex) {
        newActiveIndex = state.activeShotIndex - 1;
      }
      return { ...state, holes: newHoles, activeShotIndex: newActiveIndex };
    }

    case 'HOLE_OUT': {
      const newHoles = [...state.holes];
      let currentHole = { ...newHoles[state.currentHoleIndex] };

      if (currentHole.shots[currentHole.shots.length - 1]?.startDistance === 0) {
        return state;
      }

      currentHole.shots = [
        ...currentHole.shots,
        { shotNumber: currentHole.shots.length + 1, startDistance: 0, lie: 'Green' },
      ];

      currentHole.isCompleted = true;
      currentHole = calculateStrokesGainedForHole(currentHole, state.gender);
      newHoles[state.currentHoleIndex] = currentHole;

      return {
        ...state,
        holes: newHoles,
        activeShotIndex: currentHole.shots.length - 1
      };
    }

    case 'PREVIOUS_HOLE': {
      const prevHoleIndex = state.currentHoleIndex - 1;
      if (prevHoleIndex < 0) return state;
      return { ...state, currentHoleIndex: prevHoleIndex, activeShotIndex: 0 };
    }

    case 'NEXT_HOLE': {
      const nextHoleIndex = state.currentHoleIndex + 1;
      if (nextHoleIndex >= COURSE_DATA.holes.length) {
        return { ...state, isRoundCompleted: true };
      }

      const newHoles = [...state.holes];
      if (!newHoles[nextHoleIndex]) {
        newHoles[nextHoleIndex] = getInitialHole(nextHoleIndex, state.teeBox);
      }

      return {
        ...state,
        holes: newHoles,
        currentHoleIndex: nextHoleIndex,
        activeShotIndex: 0
      };
    }

    case 'SET_ACTIVE_SHOT': {
      return { ...state, activeShotIndex: action.payload };
    }

    case 'END_ROUND': {
      return { ...state, isRoundCompleted: true };
    }

    case 'RESET_ROUND': {
      return emptyState;
    }

    default:
      return state;
  }
};


const RoundContext = createContext<{
  state: RoundState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export const RoundProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(roundReducer, emptyState);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        dispatch({ type: 'LOAD_STATE', payload: JSON.parse(savedState) });
      }
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (state.golferName) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [state]);


  return (
    <RoundContext.Provider value={{ state, dispatch }}>
      {children}
    </RoundContext.Provider>
  );
};

export const useRound = () => {
  const context = useContext(RoundContext);
  if (context === undefined) {
    throw new Error('useRound must be used within a RoundProvider');
  }
  return context;
};
