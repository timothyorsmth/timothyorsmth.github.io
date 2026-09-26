import assert from 'node:assert/strict';
import test from 'node:test';
import { splitChunks, makeWater } from '../src/Pages/ProjectsView/projectCourse.ts';
import { createGolfWorld } from '../src/Golf/world.ts';

test('only author markers split chunks, including CRLF files', () => {
  assert.deepEqual(splitChunks('# Title\r\n\r\n## Heading\r\n---\r\n<!-- chunk -->\r\nsecond'), ['# Title\n\n## Heading\n---', 'second']);
  assert.deepEqual(splitChunks('<!-- chunk -->\n\n<!-- chunk -->'), []);
});
test('fenced examples preserve literal chunk markers', () => {
  const example = '````markdown\n```\n<!-- chunk -->\n```\n````';
  assert.deepEqual(splitChunks(example + '\n<!-- chunk -->\nNext'), [example, 'Next']);
  assert.equal(splitChunks('~~~md\n<!-- chunk -->\n~~~').length, 1);
});
test('each card has two separated ponds on both sides, contained vertically', () => {
  for (const value of [0, 0.5, 0.999999]) {
    const water = makeWater(20, () => value);
    assert.equal(water.length, 20);
    for (const { ponds, oppositeTop } of water) {
      assert.ok(oppositeTop >= 15 && oppositeTop <= 85);
      assert.equal(ponds.length, 4);
      for (const side of ['left', 'right']) {
        const pair = ponds.filter(pond => pond.side === side);
        assert.equal(pair.length, 2);
        assert.ok(320 * (pair[1].top - pair[0].top) / 100 > 48);
      }
      for (const pond of ponds) {
        assert.ok(pond.width <= 80 && pond.width >= 56);
        // The minimum-height card contains each 48px pond vertically.
        assert.ok(320 * pond.top / 100 - 24 >= 0);
        assert.ok(320 * pond.top / 100 + 24 <= 320);
      }
    }
  }
});
test('course water reports a reset contact', t => {
  const world = createGolfWorld({ x: 100, y: 100 });
  t.after(() => world.dispose());
  world.sync(800, 600, [{ id: 'water', type: 'reset', x: 100, y: 100, width: 100, height: 48 }]);
  assert.equal(world.step()?.type, 'reset');
});
