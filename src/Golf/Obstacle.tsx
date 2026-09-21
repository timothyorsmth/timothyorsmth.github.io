import React, { useEffect, useId, useRef } from 'react';
import { useGolfContext } from './GolfContext';
import type { ObstacleType } from './types';

interface ObstacleProps {
  /** 'bounce' = ball reflects off it, 'reset' = sends ball back to start, 'hole' = advances page. */
  type: ObstacleType;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wrap any existing element (text, a bar, a hole marker) in this to register
 * it as a golf obstacle. It renders a plain div — no visual changes of its own.
 */
export function Obstacle({ type, children, className, style }: ObstacleProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const { registerObstacle, unregisterObstacle } = useGolfContext();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerObstacle(id, type, el);
    return () => unregisterObstacle(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type]);

  return (
    <div ref={ref} data-golf-obstacle={type} className={className} style={style}>
      {children}
    </div>
  );
}