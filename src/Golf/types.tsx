/* Shared data shapes for positions, registered obstacle elements, and proximity subscriptions. */
/** An x/y pair; each API specifies whether it represents pixels, fractions, or velocity. */
export interface Vector2 {
    x: number;
    y: number;
}

export type ObstacleType = "wall" | "reset" | "hole" | "trigger";

/** Keeps the DOM element so responsive layout can be remeasured before simulation. */
export interface ObstacleConfig {
    id: string;
    type: ObstacleType;
    element: HTMLElement;
    /** Optional action for a trigger sensor, such as activating a navigation link. */
    onHit?: () => void;
}

/** A visual-only distance listener; radius is in pixels and onChange receives 0 through 1. */
export interface ProximitySubscriber {
  id: string;
  element: HTMLElement;
  radius: number;
  onChange: (proximity: number) => void;
}
