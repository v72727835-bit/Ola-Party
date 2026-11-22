import type { ReactNode } from 'react';
import type { useAppState } from './useAppState';
import type { deriveApp } from './deriveApp';
import type { makeAboutRows } from '../screens/ProfileParts';

/** Everything useAppState() returns. */
export type AppState = ReturnType<typeof useAppState>;
/** AppState plus values derived after the saved session loads. */
export type AppBase = ReturnType<typeof deriveApp>;
/** What every screen render function receives. */
export type AppCtx = AppBase & { aboutRows: ReturnType<typeof makeAboutRows>; honorGrid: ReactNode };
