import { useCallback, useEffect, useRef, useState } from 'react';
import { useGolfContext } from './GolfContext';
import type { Vector2 } from './types';
import { circleRectCollision, getRelativeRect, reflect } from './Collision';
import { centerViewportOn, toAbsoluteY } from './Scroll';

const FRICTION = 0.94; // velocity multiplier applied each frame
const STOP_THRESHOLD = 0.05; // speed below which the ball is considered stopped
const WALL_RESTITUTION = 0.8; // energy retained when bouncing off a screen edge
export const BALL_RADIUS = 15;

export function usePhysics() {
    const {
        containerRef,
        getObstacles,
        notifyProximity,
        startPoint,
        onReset,
        onHole,
        setHasInteracted,
        followScroll,
    } = useGolfContext();

    const [position, setPosition] = useState<Vector2>({ x: 0, y: 0 });
    const [isMoving, setIsMoving] = useState(false);
    const [hasHoled, setHasHoled] = useState(false);

    const velocityRef = useRef<Vector2>({ x: 0, y: 0 });
    const positionRef = useRef<Vector2>({ x: 0, y: 0 });
    const rafRef = useRef<number | null>(null);
    const sizeRef = useRef({ width: 0, height: 0 });
    const hasMeasuredRef = useRef(false);

    // `startPoint` is a 0-1 fraction of the container's width/height, not a
    // pixel value — so it (and every reset) lands in the same *relative* spot
    // no matter what size the screen is.
    const startPointPx = useCallback((): Vector2 | null => {
        const container = containerRef.current;
        if (!container) return null;
        return { x: startPoint.x * container.clientWidth, y: startPoint.y * container.scrollHeight };
    }, [containerRef, startPoint]);

    const stopLoop = useCallback(() => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setIsMoving(false);
    }, []);

    const resetBall = useCallback(() => {
        stopLoop();
        const container = containerRef.current;
        const px = startPointPx();
        if (!container || !px) return;
        velocityRef.current = { x: 0, y: 0 };
        positionRef.current = { ...px };
        setPosition({ ...px });
        notifyProximity(px);
        if (followScroll) {
        centerViewportOn(toAbsoluteY(container, px.y));
        }
        onReset?.();
    }, [containerRef, startPointPx, onReset, stopLoop, notifyProximity, followScroll]);
 

    const tick = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const v = velocityRef.current;
        const p = positionRef.current;

        p.x += v.x;
        p.y += v.y;
        v.x *= FRICTION;
        v.y *= FRICTION;

        // Walls: the ball is confined to the coordinate-space container — left/right
        // to its width (the screen's width), top/bottom to its full scrollable height
        // (so it bounces at the page's edges, not just the current scroll viewport).
        const width = container.clientWidth;
        const height = container.scrollHeight;
        sizeRef.current = { width, height };

        if (p.x - BALL_RADIUS < 0) {
            p.x = BALL_RADIUS;
            v.x = Math.abs(v.x) * WALL_RESTITUTION;
        } else if (p.x + BALL_RADIUS > width) {
            p.x = width - BALL_RADIUS;
            v.x = -Math.abs(v.x) * WALL_RESTITUTION;
        }

        if (p.y - BALL_RADIUS < 0) {
            p.y = BALL_RADIUS;
            v.y = Math.abs(v.y) * WALL_RESTITUTION;
        } else if (p.y + BALL_RADIUS > height) {
            p.y = height - BALL_RADIUS;
            v.y = -Math.abs(v.y) * WALL_RESTITUTION;
        }

        for (const obstacle of getObstacles()) {
            const rect = getRelativeRect(obstacle.element, container);
            const { colliding, normal, overlap } = circleRectCollision(p, BALL_RADIUS, rect);
            if (!colliding) continue;

            if (obstacle.type === 'wall') {
                p.x += normal.x * overlap;
                p.y += normal.y * overlap;
                velocityRef.current = reflect(v, normal);
            } else if (obstacle.type === 'reset') {
                resetBall();
                return;
            } else if (obstacle.type === 'hole') {
                const holeRect = getRelativeRect(obstacle.element, container);

                const holeCenter = {
                    x: (holeRect.left + holeRect.right) / 2,
                    y: (holeRect.top + holeRect.bottom) / 1.5,
                };

                // Move the ball exactly to the hole center.
                positionRef.current = holeCenter;
                setPosition(holeCenter);

                stopLoop();
                setHasHoled(true);

                setTimeout(() => {
                    onHole?.();
                }, 1000);

                return;
            }
        }

        setPosition({ ...p });
        notifyProximity(p);

        if (followScroll) {
            centerViewportOn(toAbsoluteY(container, p.y));
        }

        const speed = Math.hypot(velocityRef.current.x, velocityRef.current.y);
        if (speed < STOP_THRESHOLD) {
        stopLoop();
        return;
        }

        rafRef.current = requestAnimationFrame(tick);
    }, [containerRef, getObstacles, notifyProximity, onHole, resetBall, stopLoop]);

    const launch = useCallback(
        (velocity: Vector2) => {
        setHasInteracted(true);
        velocityRef.current = velocity;
        setIsMoving(true);
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);
        },
        [tick, setHasInteracted]
    );

    useEffect(() => stopLoop, [stopLoop]);

    // Measure the container once it's actually laid out, then place the ball
    // at its fractional start point (rather than the (0,0) placeholder above).
    useEffect(() => {
        const container = containerRef.current;
        const px = startPointPx();
        if (!container || !px) return;

        positionRef.current = px;
        setPosition(px);
        sizeRef.current = { width: container.clientWidth, height: container.scrollHeight };
        notifyProximity(px);
        hasMeasuredRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep the ball in the same *relative* spot when the window (and therefore
    // the container) resizes, instead of leaving it at a now-meaningless pixel
    // position — e.g. off the edge of a narrower screen, or floating in the
    // wrong spot relative to obstacles that reflowed with the layout.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(() => {
        const { width: oldWidth, height: oldHeight } = sizeRef.current;
        const newWidth = container.clientWidth;
        const newHeight = container.scrollHeight;

        if (hasMeasuredRef.current && oldWidth > 0 && oldHeight > 0) {
            const rescaled = {
            x: (positionRef.current.x / oldWidth) * newWidth,
            y: (positionRef.current.y / oldHeight) * newHeight,
            };
            positionRef.current = rescaled;
            setPosition(rescaled);
            notifyProximity(rescaled);
        }

        sizeRef.current = { width: newWidth, height: newHeight };
        });

        observer.observe(container);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { position, launch, isMoving, resetBall, hasHoled };
}