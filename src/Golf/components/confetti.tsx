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

  const start = origin ?? {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

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