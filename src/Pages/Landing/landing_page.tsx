/* Composes the introductory golf course: hero, skills, obstacles, helper text, scroll cue, and playable ball. */
import React, { useRef } from 'react';
import { GolfProvider } from '../../Golf/GolfContext';
import { useGolfContext } from '../../Golf/useGolfContext';
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

/** Shrinks and fades as the ball approaches, so the cue does not compete with the ball. */
function ScrollCue() {
    const ref = useRef<HTMLDivElement>(null);
    const proximity = useProximity(ref, { radius: 300 });

    const visibility = Math.max(0, 1 - proximity * 1.4);

    return (
        <div
        ref={ref}
        className="scrollCue"
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
  /** Called after sinking, with a viewport origin for the celebration. */
  onComplete?: (origin: { x: number; y: number } | null) => void;
}

// All interactive elements share the provider's coordinate space and obstacle registry.
export function LandingPage({ onComplete }: LandingPageProps) {
  return (
    <GolfProvider
      className="golfPlayablePage"
      startPoint={{ x: 0.7, y: 0.36 }} // ~70% across, ~36% down the full page — tune to your real ball spot
      onHole={onComplete}
    >
      {/* ---------- Section 1: hero section ---------- */}
      <section className="hero">
        <p className="helloText">hey there!</p>

        <Obstacle type="wall" className="titleHitbox">
          <h1 className="nameText">i'm timothy!</h1>
        </Obstacle>

        <p className="subtitleText">
          i make solutions that solve problems
          <br />
          and make life more fun :)
        </p>

        <HelperText className="helperText helperText--hero">
          click and drag to putt
        </HelperText>

        <ScrollCue />
      </section>

      {/* ---------- Section 2: about / skills ---------- */}
      <section className="about">
        <p className="about-eyebrow">i am a</p>

        <Obstacle type="wall" className="pill pill--engineer">software engineer</Obstacle>
        <Obstacle type="wall" className="pill pill--game">game developer</Obstacle>

        <div className = "designContainer">
          <span className="pill-note">(sometimes)</span>
          <Obstacle type="wall" className="pill pill--designer">ui/ux designer</Obstacle>
        </div>


        <Obstacle type="reset" className="water water--topLeft" aria-label="obstacle" />
        <Obstacle type="reset" className="water water--right" aria-label="obstacle" />
        <div className="waterTutorial">
          <p className="helperText--warning">hit to go to the top</p>
          <Obstacle type="reset" className="water water--bottomLeft" aria-label="obstacle" />
        </div>


        <Obstacle
          type="hole"
          className="holeMarker"
          aria-label="finish"
        />

        <p className="helperText helperText--hole">putt into here</p>

      </section>

      <GolfBall />
    </GolfProvider>
  );
}
