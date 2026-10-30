'use strict';

const crypto = require('node:crypto');
const { URL } = require('node:url');
const { WebSocketServer, WebSocket } = require('ws');
const maps = require('../arena/maps.json');
const physics = require('../arena/physics.js');
const { createBot, updateBot } = require('./arena-bots.js');

const MAX_ROOMS = 20;
const MAX_PLAYERS_PER_ROOM = 10;
const MAX_TOTAL_PLAYERS = 60;
const EMPTY_ROOM_MS = 10 * 60 * 1000;
const INPUT_TIMEOUT_MS = 350;

function safeName(value, fallback = 'Runner') {
  const clean = String(value || '').replace(/<[^>]*>/g, '').normalize('NFKC').replace(/[^\p{L}\p{N} ._-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  return clean || fallback;
}

function originAllowed(req) {
  if (!req.headers.origin) return true;
  try { return new URL(req.headers.origin).host === req.headers.host; }
  catch { return false; }
}

function readJSON(req, maximum = 2048) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
      if (data.length > maximum) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { reject(Object.assign(new Error('Invalid JSON body.'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function publicRoom(room) {
  return {
    id: room.id,
    name: room.name,
    mapId: room.map.id,
    mapName: room.map.name,
    players: room.players.size,
    bots: room.botCount,
    maxPlayers: room.maxPlayers,
    hostName: room.hostName,
    createdAt: room.createdAt,
    joinable: room.players.size < room.maxPlayers
  };
}

function playerState(player) {
  const p = player.physics;
  return {
    id: player.id, name: player.name, x: p.x, y: p.y, z: p.z,
    yaw: p.yaw, pitch: p.pitch, vx: p.vx, vy: p.vy, vz: p.vz,
    wallRunning: p.wallRunning, health: player.health,
    kills: player.kills, deaths: player.deaths, streak: player.streak,
    alive: player.alive, bot: Boolean(player.isBot), color: player.color || null,
    weapon: player.weapon
  };
}

function send(socket, value) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    if (socket.bufferedAmount > 1_000_000) { socket.close(1013, 'Slow connection'); return; }
    socket.send(JSON.stringify(value));
  }
}

function broadcast(room, value) {
  const body = JSON.stringify(value);
  for (const player of room.players.values()) {
    if (player.socket.readyState === WebSocket.OPEN) {
      if (player.socket.bufferedAmount > 1_000_000) { player.socket.close(1013, 'Slow connection'); continue; }
      player.socket.send(body);
    }
  }
}

function combatants(room) { return [...room.players.values(), ...room.bots.values()]; }

function bestSpawn(room) {
  const alive = combatants(room).filter(player => player.alive);
  let best = room.map.spawns[0];
  let bestDistance = -1;
  for (const spawn of room.map.spawns) {
    const distance = alive.length
      ? Math.min(...alive.map(player => Math.hypot(player.physics.x - spawn[0], player.physics.z - spawn[2])))
      : Math.random() * 0.01;
    if (distance > bestDistance) { best = spawn; bestDistance = distance; }
  }
  return best;
}

function spawnPhysics(room) {
  const spawn = bestSpawn(room);
  const state = physics.makePlayer(spawn);
  const centerYaw = Math.atan2(-spawn[0], spawn[2]);
  const eye = { x: spawn[0], y: spawn[1] + physics.EYE, z: spawn[2] };
  let bestView = -Infinity;
  for (const offset of [0, -.35, .35, -.7, .7, -1.05, 1.05]) {
    const yaw = centerYaw + offset;
    const clearDistance = physics.wallDistance(eye, directionFromAngles(yaw, 0), room.map, 45);
    const score = clearDistance - Math.abs(offset) * 4;
    if (score > bestView) { bestView = score; state.yaw = yaw; }
  }
  return state;
}

function spawnPlayer(room, player) {
  player.physics = spawnPhysics(room);
  player.health = 100;
  player.alive = true;
  player.streak = 0;
  player.respawnAt = 0;
  player.invulnerableUntil = Date.now() + 2000;
  player.input = { yaw: player.physics.yaw, pitch: 0 };
  send(player.socket, { t: 'respawn', state: playerState(player) });
}

function directionFromAngles(yaw, pitch) {
  const c = Math.cos(pitch);
  return { x: Math.sin(yaw) * c, y: Math.sin(pitch), z: -Math.cos(yaw) * c };
}

function shoot(room, shooter, requestedWeapon, now) {
  if (!shooter.alive || !shooter.ready || now < shooter.nextFireAt) return;
  const weapon = requestedWeapon === 'rail' ? 'rail' : 'pulse';
  shooter.weapon = weapon;
  const rail = weapon === 'rail';
  shooter.nextFireAt = now + (rail ? 900 : 170);
  const origin = {
    x: shooter.physics.x,
    y: shooter.physics.y + physics.EYE,
    z: shooter.physics.z
  };
  const direction = directionFromAngles(shooter.physics.yaw, shooter.physics.pitch);
  let distance = physics.wallDistance(origin, direction, room.map, rail ? 90 : 60);
  let victim = null;
  for (const player of combatants(room)) {
    if (player === shooter || !player.alive || !player.ready || now < player.invulnerableUntil) continue;
    const box = {
      x: player.physics.x, z: player.physics.z, y: player.physics.y + .05,
      w: physics.RADIUS * 2.15, d: physics.RADIUS * 2.15, h: physics.HEIGHT - .1
    };
    const hit = physics.rayBox(origin, direction, box, distance);
    if (hit < distance) { distance = hit; victim = player; }
  }
  const endpoint = [origin.x + direction.x * distance, origin.y + direction.y * distance, origin.z + direction.z * distance];
  if (victim) {
    victim.health = Math.max(0, victim.health - (shooter.isBot ? 12 : rail ? 80 : 20));
    send(victim.socket, { t: 'damage', health: victim.health, from: shooter.name });
    if (victim.health === 0) {
      victim.alive = false;
      victim.deaths += 1;
      victim.streak = 0;
      victim.respawnAt = now + 2300;
      shooter.kills += 1;
      shooter.streak += 1;
      shooter.health = Math.min(100, shooter.health + 25);
      send(shooter.socket, { t: 'heal', health: shooter.health, amount: 25 });
      broadcast(room, { t: 'frag', killer: shooter.name, killerId: shooter.id, victim: victim.name, victimId: victim.id, streak: shooter.streak });
    }
  }
  broadcast(room, {
    t: 'shot', id: shooter.id, weapon,
    from: [origin.x, origin.y, origin.z], to: endpoint,
    hit: victim ? victim.id : null
  });
}

function createArenaService() {
  const rooms = new Map();
  const wss = new WebSocketServer({ noServer: true, maxPayload: 2048, perMessageDeflate: false });
  let tickCount = 0;
  const quickplay = {
    id: 'quickplay', name: 'Quickplay', map: maps[0], maxPlayers: MAX_PLAYERS_PER_ROOM,
    hostName: 'Arena server', createdAt: new Date().toISOString(), players: new Map(),
    bots: new Map(), botCount: 2, emptySince: null
  };
  rooms.set(quickplay.id, quickplay);

  function totalPlayers() {
    return [...rooms.values()].reduce((count, room) => count + room.players.size, 0);
  }

  function listRooms() {
    return [...rooms.values()].map(publicRoom).sort((a, b) => b.players - a.players || a.name.localeCompare(b.name));
  }

  async function handleHttp(req, res, sendJSON) {
    const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    if (url.pathname === '/api/arena/rooms' && (req.method === 'GET' || req.method === 'HEAD')) {
      sendJSON(res, 200, { rooms: listRooms(), maps: maps.map(map => ({ id: map.id, name: map.name, subtitle: map.subtitle })) });
      return true;
    }
    if (url.pathname === '/api/arena/rooms' && req.method === 'POST') {
      if (!originAllowed(req)) { sendJSON(res, 403, { error: 'Cross-origin room creation is not allowed.' }); return true; }
      let body;
      try { body = await readJSON(req); }
      catch (error) { if (!res.writableEnded && !res.destroyed) sendJSON(res, error.status || 400, { error: error.message }); return true; }
      if (!body || typeof body !== 'object' || Array.isArray(body)) { sendJSON(res, 400, { error: 'Submit a room configuration object.' }); return true; }
      if (rooms.size - 1 >= MAX_ROOMS) { sendJSON(res, 503, { error: 'All hosted room slots are occupied.' }); return true; }
      const map = maps.find(item => item.id === body.mapId);
      if (!map) { sendJSON(res, 400, { error: 'Choose a valid map.' }); return true; }
      const hostName = safeName(body.hostName, 'Host');
      const room = {
        id: crypto.randomBytes(5).toString('hex'),
        name: safeName(body.name, hostName + "'s match"),
        map, maxPlayers: Math.max(2, Math.min(MAX_PLAYERS_PER_ROOM, Math.floor(Number(body.maxPlayers) || 8))),
        hostName, createdAt: new Date().toISOString(), players: new Map(), bots: new Map(),
        botCount: Math.max(0, Math.min(3, Math.floor(Number(body.bots) || 0))), emptySince: Date.now()
      };
      rooms.set(room.id, room);
      sendJSON(res, 201, { room: publicRoom(room) });
      return true;
    }
    return false;
  }

  function attach(server) {
    server.on('upgrade', (req, socket, head) => {
      let url;
      try { url = new URL(req.url, 'http://' + (req.headers.host || 'localhost')); }
      catch { socket.destroy(); return; }
      if (url.pathname !== '/api/arena/ws') { socket.destroy(); return; }
      if (!originAllowed(req)) { socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); socket.destroy(); return; }
      const room = rooms.get(url.searchParams.get('room') || 'quickplay');
      if (!room) { socket.write('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n'); socket.destroy(); return; }
      if (room.players.size >= room.maxPlayers || totalPlayers() >= MAX_TOTAL_PLAYERS) {
        socket.write('HTTP/1.1 409 Conflict\r\nConnection: close\r\n\r\n'); socket.destroy(); return;
      }
      wss.handleUpgrade(req, socket, head, connection => join(room, connection, safeName(url.searchParams.get('name'))));
    });
  }

  function join(room, socket, name) {
    if (room.players.size >= room.maxPlayers || totalPlayers() >= MAX_TOTAL_PLAYERS) { socket.close(1013, 'Room full'); return; }
    const id = crypto.randomUUID();
    const player = {
      id, name, socket, physics: spawnPhysics(room), input: {}, lastInputAt: Date.now(),
      health: 100, alive: true, ready: false, invulnerableUntil: 0,
      kills: 0, deaths: 0, streak: 0, weapon: 'pulse',
      nextFireAt: 0, respawnAt: 0, messageWindowAt: Date.now(), messageCount: 0
    };
    room.players.set(id, player);
    room.emptySince = null;
    if (room.bots.size === 0) {
      for (let index = 0; index < room.botCount; index += 1) {
        const bot = createBot(index, bestSpawn(room));
        room.bots.set(bot.id, bot);
      }
    }
    send(socket, { t: 'welcome', id, room: publicRoom(room), map: room.map, self: playerState(player), tickRate: 60 });
    broadcast(room, { t: 'presence', name: player.name, action: 'joined' });
    socket.on('message', raw => {
      const now = Date.now();
      if (now - player.messageWindowAt > 1000) { player.messageWindowAt = now; player.messageCount = 0; }
      if (++player.messageCount > 120) { socket.close(1008, 'Message rate exceeded'); return; }
      let message;
      try { message = JSON.parse(raw.toString()); }
      catch { socket.close(1007, 'Invalid message'); return; }
      if (!message || typeof message !== 'object') return;
      if (message.t === 'ready') {
        if (!player.ready) {
          player.ready = true;
          player.invulnerableUntil = now + 2000;
          send(socket, { t: 'ready', shieldMs: 2000 });
        }
      } else if (message.t === 'input') {
        player.input = {
          forward: Boolean(message.forward), back: Boolean(message.back),
          left: Boolean(message.left), right: Boolean(message.right),
          jump: Boolean(message.jump),
          yaw: Number.isFinite(message.yaw) ? Math.max(-100000, Math.min(100000, message.yaw)) : player.physics.yaw,
          pitch: Number.isFinite(message.pitch) ? Math.max(-1.45, Math.min(1.45, message.pitch)) : player.physics.pitch
        };
        player.lastInputAt = now;
      } else if (message.t === 'fire') {
        if (Number.isFinite(message.yaw)) player.physics.yaw = Math.max(-100000, Math.min(100000, message.yaw));
        if (Number.isFinite(message.pitch)) player.physics.pitch = Math.max(-1.45, Math.min(1.45, message.pitch));
        shoot(room, player, message.weapon, now);
      } else if (message.t === 'weapon') {
        player.weapon = message.weapon === 'rail' ? 'rail' : 'pulse';
      }
    });
    socket.on('close', () => {
      room.players.delete(id);
      if (room.players.size === 0) { room.emptySince = Date.now(); room.bots.clear(); }
      broadcast(room, { t: 'presence', name: player.name, action: 'left' });
    });
    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });
    socket.on('error', () => {});
  }

  const interval = setInterval(() => {
    tickCount += 1;
    const now = Date.now();
    for (const room of rooms.values()) {
      if (room.players.size) {
        for (const player of room.players.values()) {
          if (!player.alive) {
            if (now >= player.respawnAt) spawnPlayer(room, player);
            continue;
          }
          const input = now - player.lastInputAt < INPUT_TIMEOUT_MS ? player.input : {};
          physics.step(player.physics, input, room.map, physics.TICK);
        }
        for (const bot of room.bots.values()) {
          if (!bot.alive) {
            if (now >= bot.respawnAt) spawnPlayer(room, bot);
            continue;
          }
          updateBot(room, bot, now, shoot);
        }
      }
      if (tickCount % 3 === 0 && room.players.size) {
        broadcast(room, { t: 'snapshot', time: now, players: combatants(room).map(playerState) });
      }
      if (room.id !== 'quickplay' && room.emptySince && now - room.emptySince > EMPTY_ROOM_MS) rooms.delete(room.id);
    }
  }, 1000 / 60);
  interval.unref();

  const heartbeat = setInterval(() => {
    for (const client of wss.clients) {
      if (client.isAlive === false) { client.terminate(); continue; }
      client.isAlive = false;
      client.ping();
    }
  }, 30000);
  heartbeat.unref();
  function close() {
    clearInterval(interval);
    clearInterval(heartbeat);
    for (const client of wss.clients) client.terminate();
    wss.close();
  }

  return { attach, handleHttp, listRooms, close, rooms };
}

module.exports = { createArenaService, safeName, directionFromAngles };
