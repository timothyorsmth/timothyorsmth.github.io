/* Shared context contract and consumer hook. Kept separate from the provider component for React Fast Refresh. */
import type React from 'react';
import { createContext, useContext } from 'react';
import type { ObstacleConfig, Vector2, ObstacleType } from './types';

interface GolfContextValue {
    containerRef: React.RefObject<HTMLDivElement | null>;
    registerObstacle: (id: string, type: ObstacleType, element: HTMLElement, onHit?: () => void) => void;
    unregisterObstacle: (id: string) => void;
    registerProximity: (el: HTMLElement, radius: number, onChange: (proximity: number) => void) => string;
    unregisterProximity: (id: string) => void;
    notifyProximity: (ballPosition: Vector2) => void;

    getObstacles: () => ObstacleConfig[];
    hasInteracted: boolean;
    setHasInteracted: (v: boolean) => void;
    /** Fractions of the container's width and full height, rather than pixels. */
    startPoint: Vector2;
    onReset?: () => void;
    /** Receives viewport pixels after the sinking animation finishes. */
    onHole?: (origin: Vector2) => void;
    persistenceKey?: string; // Opt-in session restoration of the ball and camera.
    horizontalScrollRef?: React.RefObject<HTMLElement | null>;
    horizontalAreaRef?: React.RefObject<HTMLElement | null>;
    followScroll: boolean;
    /** Optional local wind acceleration, sampled in course coordinates. */
    sampleWind?: (position: Vector2, time: number) => Vector2;
}

export const GolfContext = createContext<GolfContextValue | null>(null)

/** Fail early if a ball, obstacle, or proximity effect is mounted outside its course. */
export function useGolfContext() {
    const ctx = useContext(GolfContext)
    if (!ctx) {
        throw new Error('useGolfContext must be used within a GolfProvider')
    }
    return ctx
}
