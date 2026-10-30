'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { WebSocket } = require('ws');
const physics = require('../arena/physics.js');
const { createBot, updateBot, gridFor, nextWaypoint } = require('../lib/arena-bots.js');
const { createArenaService } = require('../lib/arena-server.js');

const obstacleMap = {
  bounds: { width: 30, depth: 30 },
  boxes: [{ x: 0, y: 0, z: 0, w: 2, d: 12, h: 4 }],
  pads: []
};

test('training bots route around cover instead of firing through it', () => {
  const grid = gridFor(obstacleMap);
  const waypoint = nextWaypoint(grid, obstacleMap, { x: -8, z: 0 }, { x: 8, z: 0 });
  assert.ok(waypoint.x < 0);
  const bot = createBot(0, [-8, 0, 0]);
  const human = { id: 'human', alive: true, ready: true, physics: physics.makePlayer([8, 0, 0]) };
  const room = {
    map: obstacleMap,
    players: new Map([[human.id, human]]),
    bots: new Map([[bot.id, bot]])
  };
  let shots = 0;
  updateBot(room, bot, 1000, () => { shots += 1; });
  assert.equal(shots, 0, 'the wall must block bot fire');
  for (let tick = 1; tick < 240; tick += 1) {
    updateBot(room, bot, 1000 + tick * 16, () => { shots += 1; });
  }
  assert.ok(bot.physics.x > 0, 'bot should navigate around the wall to the player side');
  assert.ok(shots > 0, 'bot should fire once it gets line of sight');
});

test('Quickplay spawns two 3D training opponents without consuming human slots', async t => {
  const service = createArenaService();
  const server = http.createServer((req, res) => { res.writeHead(404); res.end(); });
  service.attach(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { service.close(); server.close(); });
  const socket = new WebSocket('ws://127.0.0.1:' + server.address().port + '/api/arena/ws?room=quickplay&name=Solo');
  t.after(() => socket.close());
  const messages = [];
  socket.on('message', bytes => messages.push(JSON.parse(bytes.toString())));
  await once(socket, 'open');
  const waitFor = async type => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const message = messages.find(item => item.t === type);
      if (message) return message;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('Timed out waiting for ' + type);
  };
  const welcome = await waitFor('welcome');
  const snapshot = await waitFor('snapshot');
  assert.equal(welcome.room.players, 1);
  assert.equal(welcome.room.bots, 2);
  assert.equal(snapshot.players.filter(player => player.bot).length, 2);
  assert.equal(snapshot.players.filter(player => !player.bot).length, 1);
  assert.ok(snapshot.players.filter(player => player.bot).every(player => player.color && player.alive));
});
