/* Subscribes an element to ball-distance updates and exposes a 0-to-1 value for visual effects. */
import { useEffect, useState } from 'react';
import { useGolfContext } from './useGolfContext';

interface UseProximityOptions {
/** Distance in px at which closeness starts ramping up from 0. */
radius: number;
}

/**
 * Tracks how close the ball currently is to the element `ref` is attached to.
 * Returns a value from 0 (ball is at `radius` distance or farther) to 1
 * (ball's center is on the element's center) — recomputed every physics
 * tick while the ball is moving. Drive any style off it: scale, rotation,
 * opacity, color, a threshold-triggered animation, etc.
 *
 * This does not affect the ball's physics — it's read-only awareness, not
 * a collision. Use <Obstacle> instead if the ball should actually bounce
 * off, reset from, or hole out on this element.
 */
export function useProximity<T extends HTMLElement>(
ref: React.RefObject<T | null>,
{ radius }: UseProximityOptions
): number {
const { registerProximity, unregisterProximity } = useGolfContext();
const [proximity, setProximity] = useState(0);

// The provider calculates distance; this hook only manages subscription and React state.
useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const id = registerProximity(el, radius, setProximity);
    return () => unregisterProximity(id);
}, [ref, radius, registerProximity, unregisterProximity]);

return proximity;
}
