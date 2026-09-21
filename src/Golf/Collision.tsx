import type { Vector2 } from './types';
 
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
 
/** Bounding box of `el`, expressed relative to `container` (not the viewport). */
export function getRelativeRect(el: HTMLElement, container: HTMLElement): Rect {
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const left = elRect.left - containerRect.left;
  const top = elRect.top - containerRect.top;
  return {
    left,
    top,
    right: left + elRect.width,
    bottom: top + elRect.height,
  };
}
 
/**
 * Circle vs axis-aligned rect collision. Returns whether they overlap, the
 * surface normal to push/reflect along, and how far the circle is embedded.
 */
export function circleRectCollision(
  center: Vector2,
  radius: number,
  rect: Rect
): { colliding: boolean; normal: Vector2; overlap: number } {
  const closestX = Math.max(rect.left, Math.min(center.x, rect.right));
  const closestY = Math.max(rect.top, Math.min(center.y, rect.bottom));
 
  const dx = center.x - closestX;
  const dy = center.y - closestY;
  const distSq = dx * dx + dy * dy;
 
  if (distSq > radius * radius) {
    return { colliding: false, normal: { x: 0, y: 0 }, overlap: 0 };
  }
 
  const dist = Math.sqrt(distSq) || 0.0001;
  return {
    colliding: true,
    normal: { x: dx / dist, y: dy / dist },
    overlap: radius - dist,
  };
}
 
/** Reflects `velocity` across `normal`, scaled by `restitution` (0-1 = energy retained). */
export function reflect(velocity: Vector2, normal: Vector2, restitution = 0.75): Vector2 {
  const dot = velocity.x * normal.x + velocity.y * normal.y;
  return {
    x: (velocity.x - 2 * dot * normal.x) * restitution,
    y: (velocity.y - 2 * dot * normal.y) * restitution,
  };
}
 