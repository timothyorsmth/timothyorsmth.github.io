import type { Vector2 } from './types';

export interface WindTiming {
  start: number;
  duration: number;
  calm: number;
}

/** Shared by the particle opacity and physics, including one-second soft fades. */
export function gustStrength(time: number, timing: WindTiming): number {
  if (time < timing.start) return 0;
  const phase = (time - timing.start) % (timing.duration + timing.calm);
  if (phase >= timing.duration) return 0;
  return Math.max(0, Math.min(1, phase / 1000, (timing.duration - phase) / 1000));
}

/** Gentle acceleration in pixels/ms², tapered over the outer 40px of a zone. */
export function windAtPoint(
  point: Vector2,
  rect: { left: number; right: number; top: number; bottom: number },
  direction: Vector2,
  strength: number,
): Vector2 {
  const edge = Math.min(point.x - rect.left, rect.right - point.x,
    point.y - rect.top, rect.bottom - point.y);
  const amount = Math.max(0, Math.min(1, edge / 40)) * strength * 0.00007;
  return { x: direction.x * amount, y: direction.y * amount };
}
