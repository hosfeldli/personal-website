'use strict';

const physics = require('../arena/physics.js');

const CELL = 2;
const BOT_NAMES = ['Razor', 'Glitch', 'Vex'];
const BOT_COLORS = ['#ff707d', '#ffd166', '#ad89ff'];

function gridFor(map) {
  const columns = Math.floor(map.bounds.width / CELL);
  const rows = Math.floor(map.bounds.depth / CELL);
  const cells = new Uint8Array(columns * rows);
  const xAt = column => -map.bounds.width / 2 + (column + .5) * CELL;
  const zAt = row => -map.bounds.depth / 2 + (row + .5) * CELL;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = xAt(column);
      const z = zAt(row);
      const blocked = map.boxes.some(box =>
        box.y < physics.HEIGHT - .1 && box.y + box.h > .1 &&
        Math.abs(x - box.x) < box.w / 2 + physics.RADIUS + .25 &&
        Math.abs(z - box.z) < box.d / 2 + physics.RADIUS + .25
      );
      cells[row * columns + column] = blocked ? 1 : 0;
    }
  }
  return { columns, rows, cells, xAt, zAt };
}

function cellIndex(grid, map, x, z) {
  const column = Math.max(0, Math.min(grid.columns - 1, Math.floor((x + map.bounds.width / 2) / CELL)));
  const row = Math.max(0, Math.min(grid.rows - 1, Math.floor((z + map.bounds.depth / 2) / CELL)));
  return row * grid.columns + column;
}

function nextWaypoint(grid, map, from, to) {
  const start = cellIndex(grid, map, from.x, from.z);
  const goal = cellIndex(grid, map, to.x, to.z);
  if (start === goal) return { x: to.x, z: to.z };
  const parent = new Int32Array(grid.cells.length);
  parent.fill(-1);
  const queue = new Int32Array(grid.cells.length);
  let front = 0;
  let back = 0;
  queue[back++] = start;
  parent[start] = start;
  let nearest = start;
  let nearestDistance = Infinity;
  const goalColumn = goal % grid.columns;
  const goalRow = Math.floor(goal / grid.columns);
  while (front < back) {
    const current = queue[front++];
    const column = current % grid.columns;
    const row = Math.floor(current / grid.columns);
    const distance = Math.abs(column - goalColumn) + Math.abs(row - goalRow);
    if (distance < nearestDistance) { nearestDistance = distance; nearest = current; }
    if (current === goal) { nearest = goal; break; }
    for (const neighbor of [
      column > 0 ? current - 1 : -1,
      column + 1 < grid.columns ? current + 1 : -1,
      row > 0 ? current - grid.columns : -1,
      row + 1 < grid.rows ? current + grid.columns : -1
    ]) {
      if (neighbor < 0 || parent[neighbor] >= 0 || grid.cells[neighbor]) continue;
      parent[neighbor] = current;
      queue[back++] = neighbor;
    }
  }
  let next = nearest;
  while (parent[next] >= 0 && parent[next] !== start && parent[next] !== next) next = parent[next];
  if (next === start) return { x: to.x, z: to.z };
  return { x: grid.xAt(next % grid.columns), z: grid.zAt(Math.floor(next / grid.columns)) };
}

function createBot(index, spawn) {
  return {
    id: 'bot-' + index,
    name: BOT_NAMES[index % BOT_NAMES.length],
    color: BOT_COLORS[index % BOT_COLORS.length],
    isBot: true,
    ready: true,
    invulnerableUntil: 0,
    socket: null,
    physics: physics.makePlayer(spawn),
    input: {},
    health: 100,
    alive: true,
    kills: 0,
    deaths: 0,
    streak: 0,
    weapon: 'pulse',
    nextFireAt: 0,
    respawnAt: 0,
    thinkAt: 0,
    fireAt: 0,
    jumpUntil: 0,
    grid: null
  };
}

function aimDirection(bot, target) {
  const dx = target.physics.x - bot.physics.x;
  const dz = target.physics.z - bot.physics.z;
  const horizontal = Math.hypot(dx, dz);
  return {
    distance: horizontal,
    yaw: Math.atan2(dx, -dz),
    pitch: Math.atan2(target.physics.y + 1.0 - bot.physics.y - physics.EYE, horizontal)
  };
}

function updateBot(room, bot, now, shoot) {
  if (!bot.alive) return;
  if (!bot.grid) bot.grid = gridFor(room.map);
  if (now >= bot.thinkAt) {
    const candidates = [...room.players.values()].filter(player => player.alive && player.ready);
    if (!candidates.length) {
      bot.input = {};
    } else {
      const target = candidates.reduce((best, player) =>
        !best || Math.hypot(player.physics.x - bot.physics.x, player.physics.z - bot.physics.z) <
          Math.hypot(best.physics.x - bot.physics.x, best.physics.z - bot.physics.z) ? player : best, null);
      const aim = aimDirection(bot, target);
      bot.physics.yaw = aim.yaw;
      bot.physics.pitch = aim.pitch;
      const waypoint = aim.distance < 6
        ? { x: target.physics.x, z: target.physics.z }
        : nextWaypoint(bot.grid, room.map, bot.physics, target.physics);
      const dx = waypoint.x - bot.physics.x;
      const dz = waypoint.z - bot.physics.z;
      const length = Math.hypot(dx, dz) || 1;
      const forward = (Math.sin(aim.yaw) * dx - Math.cos(aim.yaw) * dz) / length;
      const right = (Math.cos(aim.yaw) * dx + Math.sin(aim.yaw) * dz) / length;
      bot.input = {
        forward: forward > .22 && aim.distance > 5,
        back: forward < -.22 && aim.distance > 5,
        right: right > .22,
        left: right < -.22,
        jump: now < bot.jumpUntil,
        yaw: aim.yaw,
        pitch: aim.pitch
      };
      if (aim.distance < 13 && now > bot.jumpUntil && Math.random() < .09) {
        bot.jumpUntil = now + 170;
        bot.input.jump = true;
      }
      const origin = { x: bot.physics.x, y: bot.physics.y + physics.EYE, z: bot.physics.z };
      const direction = {
        x: Math.sin(aim.yaw) * Math.cos(aim.pitch),
        y: Math.sin(aim.pitch),
        z: -Math.cos(aim.yaw) * Math.cos(aim.pitch)
      };
      const visible = physics.wallDistance(origin, direction, room.map, aim.distance + 1) > aim.distance - .5;
      if (visible && aim.distance < 28 && now >= bot.fireAt) {
        const error = (Math.random() - .5) * (.025 + aim.distance * .003);
        bot.physics.yaw = aim.yaw + error;
        bot.physics.pitch = aim.pitch + error * .6;
        shoot(room, bot, 'pulse', now);
        bot.fireAt = now + 530 + Math.random() * 320;
        bot.input.yaw = aim.yaw;
        bot.input.pitch = aim.pitch;
      }
    }
    bot.thinkAt = now + 190 + Math.random() * 80;
  }
  bot.input.jump = now < bot.jumpUntil;
  physics.step(bot.physics, bot.input, room.map, physics.TICK);
}

module.exports = { createBot, updateBot, gridFor, nextWaypoint };
