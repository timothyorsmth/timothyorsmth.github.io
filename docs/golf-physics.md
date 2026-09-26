# Golf physics

The page uses Matter.js for the simulation and React/CSS for rendering.

- `src/Golf/world.ts` creates the ball, static walls, and reset/hole sensors.
  Gravity is disabled. Air friction slows the ball, and restitution controls bounce.
- `src/Golf/Physics.tsx` connects the simulation to the DOM, pointer launches,
  proximity subscribers, scrolling, and completion callbacks. It advances the
  engine in fixed 1/120-second steps, caps catch-up after long frame pauses, and
  stops requesting frames when the ball stops.
- Obstacles are measured in container-relative pixels. Their bodies are updated
  during motion and on observed layout resizes; the ball keeps its relative
  position when the container changes size.
  Course boundaries use `clientWidth` and `clientHeight`: `scrollHeight` can grow
  when the ball's shadow overflows, so it must not determine the bottom wall.
- Reset and hole obstacles are sensors: they detect contact without bouncing.
  The hole callback receives its center in viewport coordinates for the fixed
  confetti overlay. Further shots are blocked after holing.
- `GolfLink` and `GolfButton` register enabled controls as trigger sensors. A ball hit activates
  its normal click action once per contact. The ball stops and is placed below
  the link after navigation so it remains available under a sticky navbar.
  Disabled controls are not registered, and mouse/keyboard links still work normally.
  Home's gallery uses `GolfButton` for its left/right arrow targets, so putting
  into an enabled arrow scrolls the cards without moving the About section sideways.
- Unmounting cancels the animation frame and completion timer, disconnects the
  resize observer, and clears the Matter world and engine.

## Tuning

Ball radius, timestep, stopping threshold, air friction, and wall restitution
are in `world.ts`. Drag power and maximum launch speed are in `Golfball.tsx`.
Matter velocity uses pixels per base 1/60-second step; do not multiply pointer
launch velocities by the display frame rate. The feel is similar to the old
simulation but Matter's collision response is not identical.

## Checks

Run `npm test` for the physics regression tests (Node 24 supports the direct
TypeScript import used by these tests), `npm run build` for TypeScript and the
production bundle, and `npm run lint` for the source lint checks.

For the DOM boundary regression, run `npm run dev` and open
`/tests/golf-bounds.html`. Press Launch: the slow ball should settle with its
center around y=485 inside the 500px course, even though its shadow overflows.
This exercises the real physics hook and StrictMode lifecycle in a browser.
