/* Builds a celebratory burst of particles, passing their origin and trajectories to CSS through custom properties. */
import type { CSSProperties } from 'react';
import './confetti.css';

interface ConfettiProps {
  show: boolean;
  origin: {
    x: number;
    y: number;
  } | null;
  pieces?: number;
}

export function Confetti({
  show,
  origin,
  pieces = 30,
}: ConfettiProps) {
  if (!show) return null;

  // A missing hole position falls back to the viewport center, not the document center.
  const start = origin ?? {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  // Custom properties define each particle's path; CSS performs the animation without a JS loop.
  // The current implementation samples new trajectories each time this component renders.
  return (
    <div
      className="confetti"
      style={
        {
          '--origin-x': `${start.x}px`,
          '--origin-y': `${start.y}px`,
        } as CSSProperties
      }
    >
      {Array.from({ length: pieces }, (_, index) => (
        <span
          key={index}
          style={
            {
              '--x': `${(Math.random() - 0.5) * 260}px`,
              '--y': `${-(Math.random() * 180 + 80)}px`,
              '--rotation': `${Math.random() * 720 - 360}deg`,
              animationDelay: `${Math.random() * 0.12}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
