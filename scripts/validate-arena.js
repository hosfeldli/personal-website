'use strict';

const assert = require('node:assert/strict');
const maps = require('../arena/maps.json');
const physics = require('../arena/physics.js');

assert.ok(maps.length >= 3, 'Provide at least three distinct arenas');
const ids = new Set();
for (const map of maps) {
  assert.match(map.id, /^[a-z0-9-]+$/);
  assert.ok(!ids.has(map.id), 'Map IDs must be unique');
  ids.add(map.id);
  assert.ok(map.name && map.subtitle && map.color && map.sky);
  assert.ok(map.bounds.width >= 30 && map.bounds.depth >= 30);
  assert.ok(map.spawns.length >= 4);
  assert.ok(map.pads.length >= 2);
  for (const box of map.boxes) {
    for (const key of ['x', 'y', 'z', 'w', 'd', 'h']) assert.ok(Number.isFinite(box[key]), map.id + ': invalid box ' + key);
    assert.ok(box.w > 0 && box.d > 0 && box.h > 0);
    assert.ok(Math.abs(box.x) + box.w / 2 <= map.bounds.width / 2);
    assert.ok(Math.abs(box.z) + box.d / 2 <= map.bounds.depth / 2);
  }
  for (const spawn of map.spawns) {
    assert.equal(spawn.length, 3);
    assert.ok(Math.abs(spawn[0]) < map.bounds.width / 2 - physics.RADIUS);
    assert.ok(Math.abs(spawn[2]) < map.bounds.depth / 2 - physics.RADIUS);
    for (const box of map.boxes) {
      const horizontal = Math.abs(spawn[0] - box.x) < box.w / 2 + physics.RADIUS &&
        Math.abs(spawn[2] - box.z) < box.d / 2 + physics.RADIUS;
      const vertical = spawn[1] < box.y + box.h && spawn[1] + physics.HEIGHT > box.y;
      assert.ok(!(horizontal && vertical), map.id + ': spawn overlaps an obstacle');
    }
  }
  for (const pad of map.pads) {
    assert.ok(Math.abs(pad.x) < map.bounds.width / 2 - 1);
    assert.ok(Math.abs(pad.z) < map.bounds.depth / 2 - 1);
    assert.equal(pad.direction.length, 2);
  }
}
console.log('Validated ' + maps.length + ' multiplayer arenas.');
