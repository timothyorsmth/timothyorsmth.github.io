import assert from 'node:assert/strict';
import test from 'node:test';
import { createGolfWorld } from '../src/Golf/world.ts';

test('a shot crosses the viewport edge when the gallery continues beyond it', t => {
  const world = createGolfWorld({ x: 480, y: 200 });
  t.after(() => world.dispose());
  world.sync(1500, 500, []);
  world.launch({ x: 20, y: 0 });
  for (let i = 0; i < 10; i++) world.step();
  assert.ok(world.ball.position.x > 500);
  assert.ok(world.ball.velocity.x > 0);
});

test('camera translation preserves shot velocity and content position', t => {
  const world = createGolfWorld({ x: 480, y: 200 });
  t.after(() => world.dispose());
  world.launch({ x: 20, y: 3 });
  world.translateX(-230);
  assert.equal(world.ball.position.x + 230, 480);
  assert.deepEqual(world.ball.velocity, { x: 20, y: 3 });
  world.sync(1500, 500, [], -230);
  world.step();
  assert.ok(world.ball.position.x > 250);
  assert.ok(world.ball.velocity.x > 0);
});

test('the ball bounces at the content end after scrolling', t => {
  const world = createGolfWorld({ x: 475, y: 200 });
  t.after(() => world.dispose());
  world.sync(1500, 500, [], -1000);
  world.launch({ x: 20, y: 0 });
  for (let i = 0; i < 10; i++) world.step();
  assert.ok(world.ball.velocity.x < 0);
  assert.ok(world.ball.position.x < 485);
});


test('project walls reflect the ball without triggering navigation', t => {
  const world = createGolfWorld({ x: 100, y: 250 });
  t.after(() => world.dispose());
  world.sync(800, 600, [{ id: 'project', type: 'wall', x: 300, y: 250, width: 200, height: 250 }]);
  world.launch({ x: 28, y: 0 });
  for (let i = 0; i < 12; i++) assert.equal(world.step(), null);
  assert.ok(world.ball.velocity.x < 0);
  assert.ok(world.ball.position.x < 185);
});
