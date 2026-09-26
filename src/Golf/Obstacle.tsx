/* Registers a styled DOM element as a wall, reset area, or hole so the physics hook can measure its hitbox. */
import React, { useEffect, useId, useRef } from 'react';
import { useGolfContext } from './useGolfContext';
import type { ObstacleType } from './types';

interface ObstacleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'wall' = ball reflects off it, 'reset' = sends ball back to start, 'hole' = advances page. */
  type: ObstacleType;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wrap any existing element (text, a bar, a hole marker) in this to register
 * it as a golf obstacle. It renders a plain div — no visual changes of its own.
 */
export function Obstacle({ type, children, ...props }: ObstacleProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const { registerObstacle, unregisterObstacle } = useGolfContext();

  // Register after the div exists; remove it on unmount so physics cannot retain a stale hitbox.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerObstacle(id, type, el);
    return () => unregisterObstacle(id);
  }, [id, type, registerObstacle, unregisterObstacle]);

  return (
    <div {...props} ref={ref} data-golf-obstacle={type}>
      {children}
    </div>
  );
}
