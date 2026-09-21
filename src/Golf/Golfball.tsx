import React, { useCallback, useEffect, useState } from 'react';
import { usePhysics, BALL_RADIUS } from './Physics';
import { useGolfContext } from './GolfContext';
import type { Vector2 } from './types';

// Import CSS
import './Golfball.css';

const POWER_MULTIPLIER = 0.18; // drag distance -> launch speed
const MAX_SPEED = 28;

export function GolfBall() {
    const { containerRef } = useGolfContext();
    const { position, launch, isMoving, hasHoled } = usePhysics();
    
    const [dragStart, setDragStart] = useState<Vector2 | null>(null);
    const [dragCurrent, setDragCurrent] = useState<Vector2 | null>(null);
    const [hasEntered, setHasEntered] = useState(false);

    // Trigger the bounce-in a tick after mount so the initial scale(0) actually renders first.
    useEffect(() => {
        const t = setTimeout(() => setHasEntered(true), 50);
        return () => clearTimeout(t);
    }, []);

    const toContainerSpace = useCallback(
        (clientX: number, clientY: number): Vector2 => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: clientX, y: clientY };
        return { x: clientX - rect.left, y: clientY - rect.top };
        },
        [containerRef]
    );

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isMoving) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setDragStart(position);
        setDragCurrent(toContainerSpace(e.clientX, e.clientY));
    };
    
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragStart) return;
        setDragCurrent(toContainerSpace(e.clientX, e.clientY));
    };
    
    const handlePointerUp = () => {
        if (!dragStart || !dragCurrent) return;
        // Pulling the ball backward (away from target) and releasing shoots it forward,
        // like a slingshot / real putt — so the launch vector is start-minus-current.
        const dx = dragStart.x - dragCurrent.x;
        const dy = dragStart.y - dragCurrent.y;
        const speed = Math.min(Math.hypot(dx, dy) * POWER_MULTIPLIER, MAX_SPEED);
        const angle = Math.atan2(dy, dx);
        launch({ x: Math.cos(angle) * speed, y: Math.sin(angle) * speed });
        setDragStart(null);
        setDragCurrent(null);
    };
    
    const showAim = dragStart && dragCurrent;

    // Render the ball and the aiming line (if dragging). 
    // The ball is a simple div, but you could swap in an <img> or <canvas> or whatever. 
    // The line is an SVG <line> that stretches from the drag start to the current pointer position.
    return (
        <>
        {showAim && (
            <svg
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 9,
            }}
            >
            <line
                x1={dragStart.x}
                y1={dragStart.y}
                x2={dragCurrent.x}
                y2={dragCurrent.y}
                stroke="white"
                strokeWidth={3}
                strokeDasharray="6 6"
                opacity={0.8}
            />
            </svg>
        )}
        <div
            className={`golf-ball ${hasHoled ? 'golf-ball--holed' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: BALL_RADIUS * 2,
            height: BALL_RADIUS * 2,
            borderRadius: '50%',
            background: '#f2c14e',
            transform: 'translate(-50%, -50%)',
            animation: hasEntered ? 'golfBallDrop 1.35s linear forwards' : 'none',
            transformOrigin: 'center bottom',
            cursor: isMoving ? 'default' : 'grab',
            touchAction: 'none',
            zIndex: 10,
            }}
        />
            <div 
                className="golf-ball-shadow"
                style={{
                    position: 'absolute',
                    left: position.x - BALL_RADIUS,
                    top: position.y + BALL_RADIUS * 0.6,
                    width: BALL_RADIUS * 2,
                    height: BALL_RADIUS / 1.25,
                    background: 'black',
                    borderRadius: '50%',
                    opacity: 0.4,
                    animation: hasEntered ? 'shadowDrop 1.35s linear forwards' : 'none',
                }}
            ></div>
        </>
    );
}