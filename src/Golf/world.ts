/* Matter.js simulation with no DOM or React dependencies: creates bodies, resolves collisions, and reports sensor contacts. */
import Matter from 'matter-js';
import type { ObstacleType, Vector2 } from './types';

const { Bodies, Body, Composite, Engine, Query } = Matter;
export const BALL_RADIUS = 15;
// Two simulation steps per 60 Hz frame improve contact detection for thin obstacles.
export const STEP_MS = 1000 / 120;
// Matter reports speed in pixels per base 1/60-second step, regardless of STEP_MS.
export const STOP_THRESHOLD = 0.05;

/** Center and dimensions in container-relative pixels; the id persists across layout changes. */
export interface PhysicsObstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Matter owns movement and collisions; the page supplies container-relative geometry. */
export function createGolfWorld(start: Vector2) {
  // The course is viewed from above: drag slows the ball instead of downward gravity.
  const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
  // Infinite inertia prevents spin; surface friction is disabled for predictable putting.
  const ball = Bodies.circle(start.x, start.y, BALL_RADIUS, {
    frictionAir: 0.06, friction: 0, frictionStatic: 0, restitution: 0, inertia: Infinity,
  });
  Composite.add(engine.world, ball);
  const obstacles = new Map<string, { body: Matter.Body; config: PhysicsObstacle }>();
  let triggerContacts = new Set<string>();

  function sync(width: number, height: number, entries: PhysicsObstacle[], left = 0) {
    // Invisible boundary bodies sit outside the page, with their inner edges at the limits.
    const thickness = BALL_RADIUS * 4;
    const bounds: PhysicsObstacle[] = [
      { id: 'boundary:left', type: 'wall', x: left - thickness / 2, y: height / 2, width: thickness, height: height + thickness * 2 },
      { id: 'boundary:right', type: 'wall', x: left + width + thickness / 2, y: height / 2, width: thickness, height: height + thickness * 2 },
      { id: 'boundary:top', type: 'wall', x: left + width / 2, y: -thickness / 2, width, height: thickness },
      { id: 'boundary:bottom', type: 'wall', x: left + width / 2, y: height + thickness / 2, width, height: thickness },
    ];
    const active = new Set<string>();
    for (const config of [...bounds, ...entries]) {
      if (config.width <= 0 || config.height <= 0) continue;
      active.add(config.id);
      const existing = obstacles.get(config.id);
      // Reuse bodies when only their position changes; rebuild for a new size or behavior.
      if (existing && existing.config.type === config.type &&
          existing.config.width === config.width && existing.config.height === config.height) {
        Body.setPosition(existing.body, config);
        existing.config = config;
        continue;
      }
      if (existing) Composite.remove(engine.world, existing.body);
      const body = Bodies.rectangle(config.x, config.y, config.width, config.height, {
        // Sensors register overlap but do not physically push the ball away.
        isStatic: true, isSensor: config.type !== 'wall', friction: 0,
      });
      // setStatic resets restitution during construction, so apply bounce afterward.
      body.restitution = config.id.startsWith('boundary:') ? 0.8 : 0.75;
      obstacles.set(config.id, { body, config });
      Composite.add(engine.world, body);
    }
    // Remove bodies whose DOM obstacles disappeared or no longer have a measurable size.
    for (const [id, obstacle] of obstacles) {
      if (!active.has(id)) {
        Composite.remove(engine.world, obstacle.body);
        obstacles.delete(id);
      }
    }
  }

  return {
    ball,
    sync,
    // Camera movement changes coordinates without changing the shot velocity.
    translateX(delta: number) { Body.translate(ball, { x: delta, y: 0 }); },
    launch(velocity: Vector2) { Body.setVelocity(ball, velocity); },
    // Teleport and stop together for resets, sinking, and the final resting position.
    place(position: Vector2) {
      Body.setPosition(ball, position);
      Body.setVelocity(ball, { x: 0, y: 0 });
      Body.setAngularVelocity(ball, 0);
    },
    step(wind: Vector2 = { x: 0, y: 0 }): PhysicsObstacle | null {
      // Force scales with mass so breeze acceleration is independent of ball size.
      Body.applyForce(ball, ball.position, { x: wind.x * ball.mass, y: wind.y * ball.mass });
      Engine.update(engine, STEP_MS);
      const nextTriggerContacts = new Set<string>();
      let hit: PhysicsObstacle | null = null;
      // Matter resolves solid walls; the React hook decides what a sensor contact means.
      for (const { body, config } of obstacles.values()) {
        if (!body.isSensor || Query.collides(ball, [body]).length === 0) continue;
        if (config.type === 'trigger') {
          nextTriggerContacts.add(config.id);
          // A resting ball must leave the link before it can activate that link again.
          if (!triggerContacts.has(config.id)) hit ??= config;
        } else {
          hit ??= config;
        }
      }
      triggerContacts = nextTriggerContacts;
      return hit;
    },
    dispose() {
      // Clear both bodies and cached collision pairs when the course is unmounted.
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      obstacles.clear();
      triggerContacts.clear();
    },
  };
}
