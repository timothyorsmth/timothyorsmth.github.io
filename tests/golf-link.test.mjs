/* Regression checks for navigation sensors, including repeat contact and sticky-position updates. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createGolfWorld } from '../src/Golf/world.ts';

const link = { id: 'nav', type: 'trigger', x: 160, y: 100, width: 100, height: 38 };

function setup(t, entries = [link]) {
  const world = createGolfWorld({ x: 80, y: 100 });
  world.sync(500, 500, entries);
  t.after(() => world.dispose());
  return world;
}

test('a maximum-speed shot activates a navigation sensor', t => {
  const world = setup(t);
  world.launch({ x: 28, y: 0 });
  let hit = null;
  for (let i = 0; i < 10 && !hit; i++) hit = world.step();
  assert.equal(hit?.id, 'nav');
  assert.equal(hit?.type, 'trigger');
});

test('stopping on a link does not repeat its action; leaving and returning does', t => {
  const world = setup(t);
  world.place({ x: 160, y: 100 });
  assert.equal(world.step()?.id, 'nav');
  world.place({ ...world.ball.position });
  for (let i = 0; i < 20; i++) assert.equal(world.step(), null);
  world.place({ x: 300, y: 300 });
  assert.equal(world.step(), null);
  world.place({ x: 160, y: 100 });
  assert.equal(world.step()?.id, 'nav');
});

test('navigation sensors follow updated sticky-header positions and unregister', t => {
  const world = setup(t);
  world.sync(500, 500, [{ ...link, x: 80, y: 100 }]);
  assert.equal(world.step()?.id, 'nav');
  world.sync(500, 500, []);
  assert.equal(world.step(), null);
});

for (const type of ['reset', 'hole']) {
  test(`${type} contacts still report while overlapping`, t => {
    const world = setup(t, [{ ...link, type }]);
    world.place({ x: 160, y: 100 });
    assert.equal(world.step()?.type, type);
    assert.equal(world.step()?.type, type);
  });
}
