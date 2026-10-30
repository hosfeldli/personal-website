'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { WebSocket } = require('ws');
const maps = require('../arena/maps.json');
const physics = require('../arena/physics.js');
const { createArenaService, safeName, directionFromAngles } = require('../lib/arena-server.js');

function tick(player, input, map, count) {
  for (let i = 0; i < count; i++) physics.step(player, input, map, physics.TICK);
}

test('Three.js view yaw matches the authoritative shot and movement direction', async () => {
  const THREE = await import('three');
  for (const [yaw, pitch] of [[0, 0], [Math.PI / 2, .2], [-Math.PI / 3, -.4]]) {
    const camera = new THREE.PerspectiveCamera();
    camera.rotation.set(pitch, -yaw, 0, 'YXZ');
    const visual = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const shot = directionFromAngles(yaw, pitch);
    assert.ok(Math.abs(visual.x - shot.x) < 1e-10);
    assert.ok(Math.abs(visual.y - shot.y) < 1e-10);
    assert.ok(Math.abs(visual.z - shot.z) < 1e-10);
  }
});

test('arena physics accelerates quickly and respects world bounds', () => {
  const map = maps[0];
  const player = physics.makePlayer([20, 0, 5]);
  tick(player, { forward: true, yaw: 0 }, map, 60);
  assert.ok(Math.hypot(player.vx, player.vz) > 9);
  assert.ok(player.z < -5);
  player.x = map.bounds.width / 2 - .2;
  player.vx = 20;
  tick(player, {}, map, 1);
  assert.ok(player.x <= map.bounds.width / 2 - physics.RADIUS);
});

test('jump, double jump, and held bunny hop work', () => {
  const map = maps[0];
  const player = physics.makePlayer([20, 0, 5]);
  tick(player, { jump: true, yaw: 0 }, map, 1);
  assert.ok(player.y > 0);
  assert.equal(player.jumpsUsed, 1);
  tick(player, { jump: false, yaw: 0 }, map, 10);
  const before = player.vy;
  tick(player, { jump: true, yaw: 0 }, map, 1);
  assert.equal(player.jumpsUsed, 2);
  assert.ok(player.vy > before);
  tick(player, { jump: false, yaw: 0 }, map, 1);
  let landed = false;
  let hoppedAgain = false;
  for (let i = 0; i < 200; i++) {
    physics.step(player, { jump: true, yaw: 0 }, map, physics.TICK);
    if (player.grounded) landed = true;
    if (landed && player.vy > 8 && player.y > .2) { hoppedAgain = true; break; }
  }
  assert.ok(landed && hoppedAgain, 'holding jump should bunny-hop on landing');
});

test('wall running reduces fall speed and wall jump pushes outward', () => {
  const map = {
    bounds: { width: 30, depth: 30 },
    boxes: [{ x: 2, z: 0, y: 0, w: 1, d: 16, h: 5 }],
    pads: []
  };
  const player = physics.makePlayer([1, 0, 6]);
  player.vx = 7;
  player.vz = -9;
  player.y = 2;
  player.vy = 0;
  player.grounded = false;
  player.jumpsUsed = 1;
  tick(player, { forward: true, right: true, yaw: 0 }, map, 5);
  assert.equal(player.wallRunning, true);
  assert.ok(player.vy > -3, 'wall running should slow the fall');
  tick(player, { forward: true, right: true, jump: true, yaw: 0 }, map, 1);
  assert.ok(player.vy > 8);
  assert.equal(player.jumpsUsed, 2);
});

test('raycast respects obstacle occlusion', () => {
  const map = {
    bounds: { width: 30, depth: 30 },
    boxes: [{ x: 0, y: 0, z: 0, w: 2, d: 2, h: 3 }],
    pads: []
  };
  const origin = { x: 0, y: 1.5, z: 7 };
  const direction = { x: 0, y: 0, z: -1 };
  assert.equal(physics.wallDistance(origin, direction, map, 30), 6);
  assert.equal(physics.rayBox(origin, direction, { x: 0, y: 0, z: -5, w: 1, d: 1, h: 2 }, 6), Infinity);
});

test('room API and WebSocket server host a multiplayer match', async t => {
  const service = createArenaService();
  const server = http.createServer((req, res) => {
    const sendJSON = (response, status, value) => {
      const body = JSON.stringify(value);
      response.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
      response.end(body);
    };
    service.handleHttp(req, res, sendJSON).then(handled => {
      if (!handled) { res.writeHead(404); res.end(); }
    }).catch(error => { res.writeHead(500); res.end(error.message); });
  });
  service.attach(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { service.close(); server.close(); });
  const port = server.address().port;
  const base = 'http://127.0.0.1:' + port;
  const initial = await (await fetch(base + '/api/arena/rooms')).json();
  assert.equal(initial.rooms[0].id, 'quickplay');
  assert.equal(initial.maps.length, 3);

  const invalidResponse = await fetch(base + '/api/arena/rooms', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'null'
  });
  assert.equal(invalidResponse.status, 400);

  const createdResponse = await fetch(base + '/api/arena/rooms', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '<b>Frag Night</b>', hostName: 'Host', mapId: 'foundry', maxPlayers: 2 })
  });
  assert.equal(createdResponse.status, 201);
  const created = (await createdResponse.json()).room;
  assert.equal(created.name, 'Frag Night');
  assert.equal(created.maxPlayers, 2);
  assert.equal(safeName('<script> ⚡ Hero </script>'), 'Hero');

  const connect = async name => {
    const socket = new WebSocket('ws://127.0.0.1:' + port + '/api/arena/ws?room=' + created.id + '&name=' + name);
    const queue = [];
    const waiters = [];
    socket.on('message', bytes => {
      const message = JSON.parse(bytes.toString());
      const index = waiters.findIndex(waiter => waiter.type === message.t);
      if (index >= 0) waiters.splice(index, 1)[0].resolve(message);
      else queue.push(message);
    });
    const waitFor = (type, timeout = 2000) => {
      const index = queue.findIndex(message => message.t === type);
      if (index >= 0) return Promise.resolve(queue.splice(index, 1)[0]);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timed out waiting for ' + type)), timeout);
        waiters.push({ type, resolve: message => { clearTimeout(timer); resolve(message); } });
      });
    };
    await once(socket, 'open');
    return { socket, waitFor };
  };

  const alice = await connect('Alice');
  const welcomeAlice = await alice.waitFor('welcome');
  const bob = await connect('Bob');
  const welcomeBob = await bob.waitFor('welcome');
  assert.equal(welcomeAlice.map.id, 'foundry');
  assert.ok(welcomeAlice.self);
  const spawn = welcomeAlice.self;
  assert.ok(Math.sin(spawn.yaw) * -spawn.x + -Math.cos(spawn.yaw) * -spawn.z > 0,
    'new players should face toward the arena center');
  assert.notEqual(welcomeAlice.id, welcomeBob.id);
  alice.socket.send(JSON.stringify({ t: 'ready' }));
  bob.socket.send(JSON.stringify({ t: 'ready' }));
  assert.equal((await alice.waitFor('ready')).shieldMs, 2000);
  assert.equal((await bob.waitFor('ready')).shieldMs, 2000);

  const players = [...service.rooms.get(created.id).players.values()];
  players[0].physics = physics.makePlayer([25, 0, 5]);
  players[1].physics = physics.makePlayer([25, 0, -5]);
  players[0].invulnerableUntil = 0;
  players[1].invulnerableUntil = Date.now() + 5000;
  alice.socket.send(JSON.stringify({ t: 'fire', weapon: 'pulse', yaw: 0, pitch: 0 }));
  assert.equal((await alice.waitFor('shot')).hit, null);
  assert.equal(players[1].health, 100, 'spawn shield should prevent damage');
  players[0].nextFireAt = 0;
  players[1].invulnerableUntil = 0;
  alice.socket.send(JSON.stringify({ t: 'fire', weapon: 'pulse', yaw: 0, pitch: 0 }));
  const damage = await bob.waitFor('damage');
  assert.equal(damage.health, 80);
  const shot = await alice.waitFor('shot');
  assert.equal(shot.hit, welcomeBob.id);

  players[0].health = 50;
  players[0].nextFireAt = 0;
  alice.socket.send(JSON.stringify({ t: 'fire', weapon: 'rail', yaw: 0, pitch: 0 }));
  const frag = await alice.waitFor('frag');
  const heal = await alice.waitFor('heal');
  assert.equal(frag.killerId, welcomeAlice.id);
  assert.equal(frag.victimId, welcomeBob.id);
  assert.equal(frag.streak, 1);
  assert.equal(heal.health, 75);
  assert.equal(players[1].alive, false);

  const listing = await (await fetch(base + '/api/arena/rooms')).json();
  assert.equal(listing.rooms.find(item => item.id === created.id).players, 2);
  alice.socket.close();
  bob.socket.close();
});
