import { gustStrength, windAtPoint } from '../../Golf/wind';
import type { Vector2 } from '../../Golf/types';

/** Sample the same DOM bounds and timing that drive the visible breeze. */
export function sampleCourseWind(layout: HTMLElement | null, position: Vector2, time: number): Vector2 {
  const total = { x: 0, y: 0 };
  if (!layout) return total;
  const origin = layout.getBoundingClientRect();
  for (const zone of layout.querySelectorAll<HTMLElement>('.project-wind-zone')) {
    const data = zone.dataset;
    if (!data.start) continue;
    const rect = zone.getBoundingClientRect();
    const strength = gustStrength(time, {
      start: Number(data.start), duration: Number(data.duration), calm: Number(data.calm),
    });
    const wind = windAtPoint(position, {
      left: rect.left - origin.left, right: rect.right - origin.left,
      top: rect.top - origin.top, bottom: rect.bottom - origin.top,
    }, { x: Number(data.direction), y: 0 }, strength);
    total.x += wind.x;
    total.y += wind.y;
  }
  return total;
}


