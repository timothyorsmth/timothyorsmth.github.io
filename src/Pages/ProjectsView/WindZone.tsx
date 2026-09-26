import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { gustStrength } from '../../Golf/wind';


/** A local gust repeats after a quiet interval; particles never intercept input. */
export function WindZone({ direction }: { direction: 1 | -1 }) {
  const ref = useRef<HTMLDivElement>(null);
  const [settings] = useState(() => ({
    duration: 5000 + Math.random() * 5000,
    calm: 12000 + Math.random() * 10000,
    delay: 2000 + Math.random() * 5000,
    particles: Array.from({ length: 16 }, () => ({
      left: Math.random() * 100,
      top: 8 + Math.random() * 84,
      delay: -Math.random() * 3,
      duration: 2 + Math.random() * 2,
    })),
  }));

  useEffect(() => {
    const element = ref.current!;
    const start = performance.now() + settings.delay;
    element.dataset.start = String(start);
    let frame = 0;
    const animate = (time: number) => {
      const strength = gustStrength(time, { start, ...settings });
      element.style.opacity = String(strength * 0.65);
      element.style.setProperty('--breeze-play-state', strength > 0 ? 'running' : 'paused');
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [settings]);

  return (
    <div
      ref={ref}
      className="project-wind-zone"
      aria-hidden="true"
      data-duration={settings.duration}
      data-calm={settings.calm}
      data-direction={direction}
      style={{ '--breeze-travel': `${direction * 140}px` } as CSSProperties}
    >
      {settings.particles.map((particle, index) => (
        <i key={index} style={{
          left: `${particle.left}%`, top: `${particle.top}%`,
          animationDelay: `${particle.delay}s`, animationDuration: `${particle.duration}s`,
        }} />
      ))}
    </div>
  );
}

