import React, { useRef } from 'react';
import { GolfProvider, useGolfContext } from '../../Golf/GolfContext';
import { GolfBall } from '../../Golf/Golfball';
import { Obstacle } from '../../Golf/Obstacle';
import { useProximity } from '../../Golf/UseProximity.tsx';
import './landing_page.css';

import { FaArrowDown } from "react-icons/fa";

/** Disappears the moment the ball is first launched. */
function HelperText({ className, children }: { className: string; children: React.ReactNode }) {
    const { hasInteracted } = useGolfContext();
    if (hasInteracted) return null;
    return <p className={className}>{children}</p>;
}

/** Grows and brightens as the ball gets close, instead of just sitting static. */
function ScrollCue() {
    const ref = useRef<HTMLDivElement>(null);
    const proximity = useProximity(ref, { radius: 500 });

    const visibility = Math.max(0, 1 - proximity * 1.4);

    return (
        <div
        ref={ref}
        className="scroll-cue"
        style={{
            transform: `translateX(-50%) scale(${0.7 + visibility * 0.3})`,
            opacity: visibility,
            transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
            pointerEvents: 'none',
        }}
        aria-hidden="true"
        >
          <FaArrowDown />
        </div>
    );
}



interface LandingPageProps {
  /** Called when the ball reaches the hole. */
  onComplete?: (origin: { x: number; y: number } | null) => void;
}

export function LandingPage({ onComplete }: LandingPageProps) {
  const holeRef = useRef<HTMLDivElement>(null);

  const handleHoleComplete = () => {
    const rect = holeRef.current?.getBoundingClientRect();

    const origin = rect
      ? {
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top + rect.height / 2 + window.scrollY,
        }
      : null;

    onComplete?.(origin);
  };

  return (
    <GolfProvider
      className="golf-page"
      startPoint={{ x: 0.7, y: 0.36 }} // ~70% across, ~36% down the full page — tune to your real ball spot
      onHole={handleHoleComplete}
    >
      {/* ---------- Section 1: hero ---------- */}
      <section className="hero">
        <p className="hero-eyebrow">hey!</p>

        <Obstacle type="wall" className="title-hitbox">
          <h1 className="hero-title">i'm timothy :)</h1>
        </Obstacle>

        <p className="hero-subtitle">
          i make things that solve problems
          <br />
          and make life better
        </p>

        <HelperText className="helper-text helper-text--hero">
          click and drag to putt the ball
        </HelperText>

        <ScrollCue />
      </section>

      {/* ---------- Section 2: about / skills ---------- */}
      <section className="about">
        <p className="about-eyebrow">i am a</p>

        <span className="pill pill--engineer">software engineer</span>
        <span className="pill pill--game">game developer</span>

        <span className="pill pill--design">ui/ux designer</span>
        <span className="pill-note">(sometimes)</span>

        <HelperText className="helper-text helper-text--warning">don't hit these</HelperText>

        <Obstacle type="reset" className="bar bar--top-left" aria-label="obstacle" />
        <Obstacle type="reset" className="bar bar--right" aria-label="obstacle" />
        <Obstacle type="reset" className="bar bar--warning" aria-label="obstacle" />

        <HelperText className="helper-text helper-text--hole">putt into here</HelperText>
        <div ref={holeRef}>
          <Obstacle
            type="hole"
            className="hole-marker"
            aria-label="finish"
          />
        </div>
      </section>

      <GolfBall />
    </GolfProvider>
  );
}