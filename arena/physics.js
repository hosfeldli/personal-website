(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArenaPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RADIUS = 0.34;
  const HEIGHT = 1.8;
  const EYE = 1.55;
  const GRAVITY = 27;
  const JUMP_SPEED = 10.5;
  const DOUBLE_JUMP_SPEED = 9.4;
  const PAD_SPEED = 15;
  const MAX_SPEED = 23;
  const TICK = 1 / 60;

  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function finite(value, fallback) { return Number.isFinite(value) ? value : fallback; }

  function makePlayer(spawn) {
    return {
      x: spawn[0], y: spawn[1] || 0, z: spawn[2],
      vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0,
      grounded: true, jumpsUsed: 0, jumpHeld: false,
      wallRunning: false, wallTime: 0, wallNormalX: 0, wallNormalZ: 0,
      padCooldown: 0
    };
  }

  function overlapsBox(player, box) {
    return player.x + RADIUS > box.x - box.w / 2 &&
      player.x - RADIUS < box.x + box.w / 2 &&
      player.z + RADIUS > box.z - box.d / 2 &&
      player.z - RADIUS < box.z + box.d / 2;
  }

  function solidAtHeight(player, box) {
    return player.y < box.y + box.h - 0.025 && player.y + HEIGHT > box.y + 0.025;
  }

  function resolveHorizontal(player, map, axis) {
    let normalX = 0;
    let normalZ = 0;
    const halfW = map.bounds.width / 2 - RADIUS;
    const halfD = map.bounds.depth / 2 - RADIUS;
    if (axis === 'x') {
      if (player.x < -halfW) { player.x = -halfW; player.vx = 0; normalX = 1; }
      if (player.x > halfW) { player.x = halfW; player.vx = 0; normalX = -1; }
    } else {
      if (player.z < -halfD) { player.z = -halfD; player.vz = 0; normalZ = 1; }
      if (player.z > halfD) { player.z = halfD; player.vz = 0; normalZ = -1; }
    }
    for (const box of map.boxes) {
      if (!solidAtHeight(player, box)) continue;
      const left = box.x - box.w / 2 - RADIUS;
      const right = box.x + box.w / 2 + RADIUS;
      const near = box.z - box.d / 2 - RADIUS;
      const far = box.z + box.d / 2 + RADIUS;
      if (player.x <= left || player.x >= right || player.z <= near || player.z >= far) continue;
      if (axis === 'x') {
        const towardLeft = player.vx > 0 || (player.vx === 0 && player.x < box.x);
        player.x = towardLeft ? left : right;
        player.vx = 0;
        normalX = towardLeft ? -1 : 1;
      } else {
        const towardNear = player.vz > 0 || (player.vz === 0 && player.z < box.z);
        player.z = towardNear ? near : far;
        player.vz = 0;
        normalZ = towardNear ? -1 : 1;
      }
    }
    return [normalX, normalZ];
  }

  function accelerate(player, wishX, wishZ, wishSpeed, acceleration, dt) {
    const current = player.vx * wishX + player.vz * wishZ;
    const add = Math.min(Math.max(0, wishSpeed - current), acceleration * dt);
    player.vx += wishX * add;
    player.vz += wishZ * add;
    const speed = Math.hypot(player.vx, player.vz);
    if (speed > MAX_SPEED) {
      player.vx *= MAX_SPEED / speed;
      player.vz *= MAX_SPEED / speed;
    }
  }

  function step(player, input, map, dt) {
    dt = clamp(finite(dt, TICK), 0, 0.05);
    player.yaw = finite(input.yaw, player.yaw);
    player.pitch = clamp(finite(input.pitch, player.pitch), -1.45, 1.45);
    const jump = Boolean(input.jump);
    const jumpPressed = jump && !player.jumpHeld;
    player.jumpHeld = jump;
    player.padCooldown = Math.max(0, player.padCooldown - dt);

    if (player.grounded && jump) {
      player.vy = JUMP_SPEED;
      player.grounded = false;
      player.jumpsUsed = 1;
      player.wallRunning = false;
    } else if (!player.grounded && jumpPressed && player.wallRunning) {
      player.vy = JUMP_SPEED;
      player.vx += player.wallNormalX * 8.2;
      player.vz += player.wallNormalZ * 8.2;
      player.wallRunning = false;
      player.jumpsUsed = 2;
    } else if (!player.grounded && jumpPressed && player.jumpsUsed < 2) {
      player.vy = DOUBLE_JUMP_SPEED;
      player.jumpsUsed = 2;
      player.wallRunning = false;
    }

    const forward = Number(Boolean(input.forward)) - Number(Boolean(input.back));
    const strafe = Number(Boolean(input.right)) - Number(Boolean(input.left));
    let wishX = Math.sin(player.yaw) * forward + Math.cos(player.yaw) * strafe;
    let wishZ = -Math.cos(player.yaw) * forward + Math.sin(player.yaw) * strafe;
    const length = Math.hypot(wishX, wishZ);
    if (length > 0) { wishX /= length; wishZ /= length; }
    if (player.grounded && !jump) {
      const speed = Math.hypot(player.vx, player.vz);
      const drop = Math.max(0, speed - Math.max(speed, 7) * 7.2 * dt);
      if (speed > 0) { player.vx *= drop / speed; player.vz *= drop / speed; }
    }
    if (length > 0) accelerate(player, wishX, wishZ, player.grounded ? 13.5 : 17, player.grounded ? 130 : 21, dt);

    const previousY = player.y;
    player.vy -= (player.wallRunning ? 6 : GRAVITY) * dt;
    player.x += player.vx * dt;
    const nx = resolveHorizontal(player, map, 'x');
    player.z += player.vz * dt;
    const nz = resolveHorizontal(player, map, 'z');
    player.y += player.vy * dt;

    let floor = 0;
    for (const box of map.boxes) {
      if (!overlapsBox(player, box)) continue;
      const top = box.y + box.h;
      if (previousY >= top - 0.035 && player.y <= top && player.vy <= 0) floor = Math.max(floor, top);
      const bottom = box.y;
      if (previousY + HEIGHT <= bottom + 0.035 && player.y + HEIGHT >= bottom && player.vy > 0) {
        player.y = bottom - HEIGHT;
        player.vy = 0;
      }
    }
    if (player.y <= floor) {
      player.y = floor;
      player.vy = 0;
      player.grounded = true;
      player.jumpsUsed = 0;
      player.wallRunning = false;
      player.wallTime = 0;
    } else {
      player.grounded = false;
      const normalX = nx[0] || nz[0];
      const normalZ = nx[1] || nz[1];
      const speed = Math.hypot(player.vx, player.vz);
      if ((normalX || normalZ) && speed > 3.5 && player.y > 0.2 && player.wallTime < 1.25) {
        player.wallRunning = true;
        player.wallNormalX = normalX;
        player.wallNormalZ = normalZ;
        player.wallTime += dt;
        player.vy = Math.max(player.vy, -1.5);
      } else {
        player.wallRunning = false;
      }
    }

    if (player.padCooldown === 0) {
      for (const pad of map.pads) {
        if (Math.hypot(player.x - pad.x, player.z - pad.z) < 1.55 && player.y < 0.35) {
          player.vy = PAD_SPEED;
          player.vx += pad.direction[0] * 5;
          player.vz += pad.direction[1] * 5;
          player.grounded = false;
          player.jumpsUsed = 1;
          player.padCooldown = 0.65;
          break;
        }
      }
    }
    return player;
  }

  function rayBox(origin, direction, box, maxDistance) {
    const min = [box.x - box.w / 2, box.y, box.z - box.d / 2];
    const max = [box.x + box.w / 2, box.y + box.h, box.z + box.d / 2];
    const o = [origin.x, origin.y, origin.z];
    const d = [direction.x, direction.y, direction.z];
    let near = 0;
    let far = maxDistance;
    for (let i = 0; i < 3; i += 1) {
      if (Math.abs(d[i]) < 1e-8) {
        if (o[i] < min[i] || o[i] > max[i]) return Infinity;
        continue;
      }
      let a = (min[i] - o[i]) / d[i];
      let b = (max[i] - o[i]) / d[i];
      if (a > b) { const temp = a; a = b; b = temp; }
      near = Math.max(near, a);
      far = Math.min(far, b);
      if (near > far) return Infinity;
    }
    return near >= 0 ? near : Infinity;
  }

  function wallDistance(origin, direction, map, maxDistance) {
    let distance = maxDistance;
    for (const box of map.boxes) distance = Math.min(distance, rayBox(origin, direction, box, distance));
    const w = map.bounds.width / 2;
    const d = map.bounds.depth / 2;
    const boundary = [
      { x: -w - .5, z: 0, w: 1, d: d * 2 + 2, y: 0, h: 8 },
      { x: w + .5, z: 0, w: 1, d: d * 2 + 2, y: 0, h: 8 },
      { x: 0, z: -d - .5, w: w * 2 + 2, d: 1, y: 0, h: 8 },
      { x: 0, z: d + .5, w: w * 2 + 2, d: 1, y: 0, h: 8 }
    ];
    for (const box of boundary) distance = Math.min(distance, rayBox(origin, direction, box, distance));
    return distance;
  }

  return { RADIUS, HEIGHT, EYE, TICK, makePlayer, step, rayBox, wallDistance };
});
