import assert from 'node:assert/strict';
import test from 'node:test';
import { gustStrength, windAtPoint } from '../src/Golf/wind.ts';
import { createGolfWorld } from '../src/Golf/world.ts';

const timing = { start: 2000, duration: 7000, calm: 15000 };
test('gusts fade in and out, stay calm, and return on schedule', () => {
  assert.equal(gustStrength(1000, timing), 0);
  assert.equal(gustStrength(2500, timing), 0.5);
  assert.equal(gustStrength(4500, timing), 1);
  assert.equal(gustStrength(8500, timing), 0.5);
  assert.equal(gustStrength(9000, timing), 0);
  assert.equal(gustStrength(23000, timing), 0);
  assert.equal(gustStrength(24500, timing), 0.5);
});
test('wind is local, directional, and softens near zone boundaries', () => {
  const rect = { left: 100, right: 500, top: 100, bottom: 500 };
  const direction = { x: -1, y: 0 };
  assert.deepEqual(windAtPoint({ x: 50, y: 200 }, rect, direction, 1), { x: -0, y: 0 });
  const full = windAtPoint({ x: 200, y: 200 }, rect, direction, 1);
  const edge = windAtPoint({ x: 120, y: 200 }, rect, direction, 1);
  assert.ok(full.x < 0);
  assert.equal(edge.x, full.x / 2);
  assert.equal(windAtPoint({ x: 200, y: 200 }, rect, direction, 0).x, -0);
});
test('a breeze gently moves a resting ball and drag settles it after the gust', t => {
  const world = createGolfWorld({ x: 300, y: 300 });
  t.after(() => world.dispose());
  world.sync(1000, 1000, []);
  for (let i = 0; i < 600; i++) world.step({ x: 0.00007, y: 0 });
  assert.ok(world.ball.position.x > 320 && world.ball.position.x < 420);
  assert.ok(world.ball.speed < 0.5);
  assert.equal(world.ball.position.y, 300);
  for (let i = 0; i < 240; i++) world.step();
  assert.ok(world.ball.speed < 0.01);
});
