/* Provides the golf coordinate container and registries for obstacles and proximity effects to all descendants. */
import React from 'react'
import { useCallback, useRef, useState } from 'react'

import type { ObstacleConfig, Vector2, ProximitySubscriber, ObstacleType } from './types'
import { getRelativeRect } from './Collision';
import { GolfContext } from './useGolfContext';

interface GolfProviderProps {
    children: React.ReactNode
    
    /**
     * Where the ball spawns, and where `reset` obstacles send it back to.
     * A 0-1 fraction of the container's width/height (NOT pixels) — e.g.
     * `{ x: 0.7, y: 0.36 }` is 70% across, 36% down — so it stays in the same
     * relative spot regardless of screen size.
     */
    startPoint: Vector2

    // Called every time a reset obstacle is hit
    onReset?: () => void

    // Called after sinking, with the hole center in viewport pixels for the confetti overlay.
    onHole?: (origin: Vector2) => void

    className?: string;
    sampleWind?: (position: Vector2, time: number) => Vector2;
    style?: React.CSSProperties;
    persistenceKey?: string; // Opt-in session restoration of the ball and camera.
    horizontalScrollRef?: React.RefObject<HTMLElement | null>;
    horizontalAreaRef?: React.RefObject<HTMLElement | null>;
    followScroll?: boolean; // if true, the viewport will follow the ball as it moves
}

export function GolfProvider({ children, startPoint, onReset, onHole, className, style, persistenceKey, horizontalScrollRef, horizontalAreaRef, sampleWind, followScroll = true }: GolfProviderProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    // Registrations are read by the physics loop; changing them need not re-render the page.
    const obstaclesRef = useRef<Map<string, ObstacleConfig>>(new Map())
    const proximityRef = useRef<Map<string, ProximitySubscriber>>(new Map())
    const proximityIdRef = useRef(0);
    const [hasInteracted, setHasInteracted] = useState(false)

    const registerObstacle = useCallback((id: string, type: ObstacleType, element: HTMLElement, onHit?: () => void) => {
        obstaclesRef.current.set(id, { id, type, element, onHit })
    }, []);

    const unregisterObstacle = useCallback((id: string) => {
        obstaclesRef.current.delete(id);
    }, []);

    const getObstacles = useCallback(() => Array.from(obstaclesRef.current.values()), []);

    const registerProximity = useCallback(
        (element: HTMLElement, radius: number, onChange: (proximity: number) => void) => {
            const id = `proximity-${proximityIdRef.current++}`;
            proximityRef.current.set(id, { id, element: element, radius, onChange });
            return id;
        },
        []
    );

    const unregisterProximity = useCallback((id: string) => {
        proximityRef.current.delete(id);
    }, []);

    // Called from the physics tick with the ball's current position. Distance is measured
    // to each subscribed element's center; `proximity` is 1 at the center, 0 at `radius` or beyond.
    const notifyProximity = useCallback((ballPosition: Vector2) => {
        const container = containerRef.current;
        if (!container) return;
    
        proximityRef.current.forEach((sub) => {
        const rect = getRelativeRect(sub.element, container);
        const centerX = (rect.left + rect.right) / 2;
        const centerY = (rect.top + rect.bottom) / 2;
        const distance = Math.hypot(ballPosition.x - centerX, ballPosition.y - centerY);
        const proximity = Math.max(0, Math.min(1, 1 - distance / sub.radius));
        sub.onChange(proximity);
        });
    }, []);
    
    return (
        <GolfContext.Provider
            value={{
                containerRef,
                registerObstacle,
                unregisterObstacle,
                getObstacles,
                registerProximity,
                unregisterProximity,
                notifyProximity,
                hasInteracted,
                setHasInteracted,
                startPoint,
                onReset,
                onHole,
                followScroll,
                sampleWind,
                persistenceKey,
                horizontalScrollRef,
                horizontalAreaRef,
            }}
        >

            {/* This div is the coordinate space every ball/obstacle position is measured against. */}
            <div
                ref={containerRef}
                className={className}
                style={{ position: 'relative', width: '100%', ...style }}
            > 
                {children}
            </div>
        </GolfContext.Provider>
    )
}
