/* React bridge for the Matter world: measures the page, schedules simulation steps, and publishes ball state to the UI. */
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { useGolfContext } from './useGolfContext';
import { getRelativeRect } from './Collision';
import { centerViewportOn, toAbsoluteY } from './Scroll';
import { BALL_RADIUS, createGolfWorld, STEP_MS, STOP_THRESHOLD } from './world';
import type { Vector2 } from './types';

interface Controls {
  launch: (velocity: Vector2) => void;
  reset: () => void;
  setAiming: (aiming: boolean) => void;
}

export function usePhysics() {
  const { containerRef, getObstacles, notifyProximity, startPoint,
    onReset, onHole, setHasInteracted, followScroll, horizontalScrollRef, horizontalAreaRef, persistenceKey, sampleWind } = useGolfContext();
  const hasWind = Boolean(sampleWind);
  const readWind = useEffectEvent((point: Vector2, time: number) => sampleWind?.(point, time) ?? { x: 0, y: 0 });
  const [position, setPosition] = useState<Vector2>({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [hasHoled, setHasHoled] = useState(false);
  // Stable UI callbacks delegate to the controls for the currently mounted world.
  const controlsRef = useRef<Controls | null>(null);

  // Read current props without rebuilding the engine on a parent render.
  const getStart = useEffectEvent(() => startPoint);
  const didReset = useEffectEvent(() => onReset?.());
  const didHole = useEffectEvent((origin: Vector2) => onHole?.(origin));
  const shouldFollow = useEffectEvent(() => followScroll);
  const publish = useEffectEvent((next: Vector2, scroll: boolean) => {
    setPosition(next);
    notifyProximity(next);
    const container = containerRef.current;
    if (scroll && followScroll && container) centerViewportOn(toAbsoluteY(container, next.y));
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let width = container.clientWidth;
    // Use layout height: scrollHeight includes the ball/shadow overflow and would move
    // the bottom wall away from the ball, incorrectly treating movement as a resize.
    let height = container.clientHeight;
    // startPoint is fractional; Matter needs pixels within the full course layout.
    const spawn = () => ({ x: getStart().x * width, y: getStart().y * height });
    const world = createGolfWorld(spawn());
    // Loop-local flags change immediately, without waiting for React to render new state.
    let moving = false;
    let shotActive = false;
    let aiming = false;
    let holed = false;
    let frame: number | null = null;
    let lastTime = 0;
    let accumulator = 0;
    let holeTimer: ReturnType<typeof setTimeout> | undefined;
    const gallery = horizontalScrollRef?.current;
    const horizontalArea = horizontalAreaRef?.current;
    // Persist only opted-in courses. Restore at rest so returning never resumes an old shot.
    // Storage can be unavailable in private/restricted browsers; gameplay still works there.
    if (persistenceKey) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(persistenceKey) ?? 'null');
        if (saved && [saved.x, saved.y, saved.width, saved.height, saved.scrollX, saved.scrollY].every(Number.isFinite)
            && saved.width > 0 && saved.height > 0) {
          gallery?.scrollTo({ left: saved.scrollX, behavior: 'instant' });
          world.place({ x: saved.x * width / saved.width,
            y: Math.max(BALL_RADIUS, Math.min(height - BALL_RADIUS, saved.y * height / saved.height)) });
          window.scrollTo({ top: saved.scrollY, behavior: 'instant' });
        }
      } catch { /* Ignore stale or inaccessible storage. */ }
    }
    let lastScrollLeft = gallery?.scrollLeft ?? 0;
    function saveCourse() {
      if (!persistenceKey) return;
      try {
        sessionStorage.setItem(persistenceKey, JSON.stringify({ ...world.ball.position,
          width, height, scrollX: gallery?.scrollLeft ?? 0, scrollY: window.scrollY }));
      } catch { /* Storage is optional, not a requirement for navigation. */ }
    }

    // Capture before a link navigates, including keyboard activation. pagehide also
    // covers browser Back/Forward and leaving through the address bar.
    container.addEventListener('click', saveCourse, true);
    window.addEventListener('pagehide', saveCourse);
    // Remember where the ball enters the viewport instead of pulling it to the
    // center. Store a fraction so the follow point also adapts to window resizing.
    let horizontalFollowPoint: number | null = null;

    function inHorizontalArea() {
      if (!gallery || !horizontalArea) return false;
      const rect = getRelativeRect(horizontalArea, container!);
      return world.ball.position.y >= rect.top && world.ball.position.y <= rect.bottom;
    }

    // Keep the ball attached to the gallery's content during both manual and camera scrolling.
    function applyHorizontalScroll() {
      if (!gallery) return;
      const delta = gallery.scrollLeft - lastScrollLeft;
      lastScrollLeft = gallery.scrollLeft;
      if (inHorizontalArea()) world.translateX(-delta);
    }

    function followHorizontally() {
      if (!gallery || !inHorizontalArea() || !shouldFollow()) {
        horizontalFollowPoint = null;
        return;
      }
      const rect = getRelativeRect(gallery, container!);
      const viewportWidth = rect.right - rect.left;
      if (viewportWidth <= 0) return;
      if (horizontalFollowPoint === null) {
        // Entering Projects must not move the camera. Subsequent frames follow
        // movement relative to this position, preserving the ball's on-screen X.
        horizontalFollowPoint = (world.ball.position.x - rect.left) / viewportWidth;
        return;
      }
      const followX = rect.left + horizontalFollowPoint * viewportWidth;
      gallery.scrollLeft += world.ball.position.x - followX;
      applyHorizontalScroll();
    }

    function onGalleryScroll() {
      // Camera scrolls were already consumed synchronously above. Only manual
      // scrolling should establish a new follow point, avoiding a snap back.
      if (gallery && gallery.scrollLeft !== lastScrollLeft) horizontalFollowPoint = null;
      applyHorizontalScroll();
      syncGeometry();
      publish({ ...world.ball.position }, false);
    }

    function syncGeometry() {
      const newWidth = container!.clientWidth;
      const newHeight = container!.clientHeight;
      if (newWidth !== width || newHeight !== height) {
        // Preserve relative placement on resize, but keep the ball inside the new edges.
        const rescaled = {
          x: Math.max(BALL_RADIUS, Math.min(newWidth - BALL_RADIUS, world.ball.position.x * newWidth / (width || newWidth))),
          y: Math.max(BALL_RADIUS, Math.min(newHeight - BALL_RADIUS, world.ball.position.y * newHeight / (height || newHeight))),
        };
        // place() stops the body, so restore its velocity if a resize happens mid-shot.
        const velocity = { ...world.ball.velocity };
        world.place(rescaled);
        world.launch(velocity);
        width = newWidth;
        height = newHeight;
        publish(rescaled, false);
      }
      const horizontal = inHorizontalArea() && gallery;
      // Only the gallery has a wider course. Its walls move with the camera and
      // remain at the content ends, rather than bouncing the ball at screen edges.
      const left = horizontal ? -horizontal.scrollLeft : 0;
      const courseWidth = horizontal ? width + horizontal.scrollWidth - horizontal.clientWidth : width;
      if (!horizontal) {
        const x = Math.max(BALL_RADIUS, Math.min(width - BALL_RADIUS, world.ball.position.x));
        world.translateX(x - world.ball.position.x);
      }
      world.sync(courseWidth, height, getObstacles().map(({ id, type, element }) => {
        const rect = getRelativeRect(element, container!);
        return { id, type, x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2,
          width: rect.right - rect.left, height: rect.bottom - rect.top };
      }), left);
    }

    // Cancel a pending completion and return the ball to its current responsive spawn point.
    function reset() {
      horizontalFollowPoint = null;
      clearTimeout(holeTimer);
      moving = false;
      shotActive = false;
      holed = false;
      accumulator = 0;
      world.place(spawn());
      setIsMoving(false);
      setHasHoled(false);
      publish({ ...world.ball.position }, true);
      didReset();
    }

    function tick(time: number) {
      // Cap catch-up after a stalled/backgrounded frame to avoid a large simulation burst.
      const elapsed = lastTime ? Math.min(time - lastTime, 100) : 0;
      lastTime = time;
      const breeze = !holed && !aiming ? readWind(world.ball.position, time) : { x: 0, y: 0 };
      if (!moving && !holed && !aiming && Math.hypot(breeze.x, breeze.y) > 0.000001) {
        moving = true;
      }
      if (moving) {
        syncGeometry();
        accumulator += elapsed;
        // Carry leftover time forward so physics speed does not depend on display refresh rate.
        while (accumulator >= STEP_MS && moving) {
          accumulator -= STEP_MS;
          syncGeometry();
          const wind = readWind(world.ball.position, time);
          const hit = world.step(wind);
          if (hit?.type === 'reset') {
            reset();
          } else if (hit?.type === 'trigger') {
            // Stop before navigating; following the ball afterward would undo the link's scroll.
            moving = false;
            shotActive = false;
            accumulator = 0;
            frame = null;
            world.place({ ...world.ball.position });
            setIsMoving(false);
            publish({ ...world.ball.position }, false);
            const trigger = getObstacles().find(obstacle => obstacle.id === hit.id);
            trigger?.onHit?.();
            // Anchor navigation scrolls the page. Keep the ball playable below the link
            // in its new viewport position, clear of the sticky header and its hitbox.
            frame = requestAnimationFrame(() => {
              frame = null;
              if (!trigger?.element.isConnected) return;
              syncGeometry();
              const rect = getRelativeRect(trigger.element, container!);
              const next = {
                x: Math.max(BALL_RADIUS, Math.min(width - BALL_RADIUS, (rect.left + rect.right) / 2)),
                y: Math.max(BALL_RADIUS, Math.min(height - BALL_RADIUS, rect.bottom + BALL_RADIUS * 3)),
              };
              world.place(next);
              publish(next, false);
              if (hasWind) frame = requestAnimationFrame(tick);
            });
            return;
          } else if (hit?.type === 'hole') {
            moving = false;
            holed = true;
            world.place({ x: hit.x, y: hit.y });
            setIsMoving(false);
            setHasHoled(true);
            // Let the one-second sinking animation finish before starting the celebration.
            holeTimer = setTimeout(() => {
              // Confetti is fixed to the viewport, so measure after any following scroll.
              const element = getObstacles().find(obstacle => obstacle.id === hit.id)?.element;
              const rect = element?.getBoundingClientRect();
              const containerRect = container!.getBoundingClientRect();
              didHole(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
                : { x: containerRect.left + hit.x, y: containerRect.top + hit.y });
            }, 1000);
          } else if (world.ball.speed < STOP_THRESHOLD && Math.hypot(wind.x, wind.y) < 0.000001) {
            moving = false;
            shotActive = false;
            world.place({ ...world.ball.position });
            setIsMoving(false);
          }
        }
        // Copy Matter's mutable position and update React once per display frame.
        followHorizontally();
        publish({ ...world.ball.position }, shotActive);
      }
      // Wind courses also poll at rest so a new gust can wake the ball.
      frame = moving || (hasWind && !holed) ? requestAnimationFrame(tick) : null;
    }

    controlsRef.current = {
      launch(velocity) {
        if (holed || shotActive) return;
        aiming = false;
        shotActive = true;
        // A new putt starts following from the current position, including after
        // a boundary bounce or navigation, rather than returning to an old target.
        horizontalFollowPoint = null;
        world.launch(velocity);
        moving = true;
        accumulator = 0;
        lastTime = performance.now();
        if (frame === null) frame = requestAnimationFrame(tick);
        setIsMoving(true);
        setHasInteracted(true);
      },
      reset,
      setAiming(value) {
        aiming = value;
        if (value && !shotActive) {
          moving = false;
          accumulator = 0;
          world.place({ ...world.ball.position });
        }
      },
    };
    if (hasWind) frame = requestAnimationFrame(tick);
    // Observer callbacks also place the initial ball after the DOM has laid out.
    const observer = new ResizeObserver(() => {
      syncGeometry();
      publish({ ...world.ball.position }, false);
    });
    observer.observe(container);
    if (gallery) {
      observer.observe(gallery);
      gallery.addEventListener('scroll', onGalleryScroll, { passive: true });
    }
    for (const obstacle of getObstacles()) observer.observe(obstacle.element);

    // Also runs during StrictMode's development remount, preventing duplicate worlds/loops.
    return () => {
      saveCourse();
      container.removeEventListener('click', saveCourse, true);
      window.removeEventListener('pagehide', saveCourse);
      if (frame !== null) cancelAnimationFrame(frame);
      clearTimeout(holeTimer);
      observer.disconnect();
      gallery?.removeEventListener('scroll', onGalleryScroll);
      controlsRef.current = null;
      world.dispose();
    };
  }, [containerRef, getObstacles, setHasInteracted, horizontalScrollRef, horizontalAreaRef, persistenceKey, hasWind]);

  const launch = useCallback((velocity: Vector2) => controlsRef.current?.launch(velocity), []);
  const resetBall = useCallback(() => controlsRef.current?.reset(), []);
  const setAiming = useCallback((value: boolean) => controlsRef.current?.setAiming(value), []);
  return { position, launch, isMoving, resetBall, hasHoled, setAiming };
}
