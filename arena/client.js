import * as THREE from '/vendor/three.module.js';

const Physics = window.ArenaPhysics;
const $ = id => document.getElementById(id);
const browser = $('browser');
const pause = $('pause');
const hud = $('hud');
const roomList = $('room-list');
const mapSelect = $('map-select');
const playerName = $('player-name');
const roomName = $('room-name');
const browserError = $('browser-error');
const connection = $('connection');
const viewport = $('viewport');
const health = $('health');
const healthMeter = $('health-meter');
const speedLabel = $('speed');
const movementMode = $('movement-mode');
const arenaName = $('arena-name');
const frags = $('frags');
const deaths = $('deaths');
const streakLabel = $('streak');
const leaderboard = $('leaderboard');
const killFeed = $('kill-feed');
const hitMarker = $('hit-marker');
const damageFlash = $('damage-flash');
const fovInput = $('fov');
const fovValue = $('fov-value');

let renderer;
let scene;
let camera;
let world;
let viewGun;
let map;
let socket;
let room;
let selfId;
let local;
let selfAlive = false;
let currentWeapon = 'pulse';
let mouseDown = false;
let yaw = 0;
let pitch = 0;
let lastFrame = performance.now();
let accumulator = 0;
let inputSendAt = 0;
let fireSendAt = 0;
let roomRefreshTimer;
let recoil = 0;
let muzzleUntil = 0;
let audioContext;
let fov = 110;
const keys = new Set();
const avatars = new Map();
const shotLines = [];

try {
  playerName.value = localStorage.getItem('arena-name') || '';
  fov = Number(localStorage.getItem('arena-fov')) || 110;
} catch {}
fov = Math.max(90, Math.min(125, fov));
fovInput.value = String(fov);
fovValue.textContent = fov + '°';

function showError(message) {
  browserError.textContent = message;
  browserError.hidden = false;
}
function clearError() { browserError.hidden = true; browserError.textContent = ''; }
function toast(message) {
  const element = $('toast');
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { element.hidden = true; }, 2500);
}
function playSound(kind) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const profiles = {
      pulse: [180, 72, .12, .045, 'sawtooth'],
      rail: [620, 95, .32, .085, 'sawtooth'],
      hit: [720, 1150, .075, .034, 'triangle'],
      frag: [420, 850, .22, .07, 'triangle'],
      death: [190, 60, .36, .08, 'sawtooth'],
      start: [310, 620, .12, .025, 'sine']
    };
    const [from, to, duration, volume, type] = profiles[kind] || profiles.start;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(Math.max(.0001, volume), now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch {}
}
function setConnection(text, online = false) {
  connection.textContent = text;
  connection.classList.toggle('online', online);
}
function rememberName() {
  const value = playerName.value.trim().slice(0, 24) || 'Runner';
  try { localStorage.setItem('arena-name', value); } catch {}
  return value;
}
function send(message) {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

async function refreshRooms() {
  if (browser.hidden) return;
  try {
    const response = await fetch('/api/arena/rooms', { cache: 'no-store' });
    if (!response.ok) throw new Error('Server browser unavailable.');
    const data = await response.json();
    if (!mapSelect.options.length) {
      for (const item of data.maps) {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        mapSelect.append(option);
      }
    }
    roomList.replaceChildren();
    if (!data.rooms.length) roomList.textContent = 'No rooms yet. Host the first match.';
    for (const item of data.rooms) {
      const row = document.createElement('div');
      row.className = 'room-row';
      const summary = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = item.name;
      const detail = document.createElement('small');
      detail.textContent = item.mapName + ' · hosted by ' + item.hostName + (item.bots ? ' · ' + item.bots + ' bots' : '');
      summary.append(title, detail);
      const count = document.createElement('span');
      count.className = 'room-count';
      count.textContent = item.players + ' / ' + item.maxPlayers;
      const join = document.createElement('button');
      join.type = 'button';
      join.textContent = item.joinable ? 'Join →' : 'Full';
      join.disabled = !item.joinable;
      join.addEventListener('click', () => joinRoom(item.id));
      row.append(summary, count, join);
      roomList.append(row);
    }
  } catch (error) {
    roomList.textContent = error.message || 'Could not load rooms.';
  }
}

async function hostRoom() {
  clearError();
  const button = $('host-room');
  button.disabled = true;
  try {
    const response = await fetch('/api/arena/rooms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: roomName.value.trim() || rememberName() + "'s match",
        hostName: rememberName(), mapId: mapSelect.value,
        maxPlayers: Number($('max-players').value), bots: Number($('bot-count').value)
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not host a match.');
    joinRoom(data.room.id);
  } catch (error) { showError(error.message); }
  finally { button.disabled = false; }
}

function disposeAvatar(avatar) {
  scene.remove(avatar.group);
  avatar.group.traverse(object => {
    object.geometry?.dispose();
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        material.map?.dispose();
        material.dispose();
      }
    }
  });
}

function disposeWorld() {
  if (!world) return;
  scene.remove(world);
  world.traverse(object => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material.dispose();
    }
  });
  world = null;
}

function initRenderer() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  viewport.append(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 1, .05, 150);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  const hemisphere = new THREE.HemisphereLight(0x9ab6e5, 0x141927, 2.2);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(-12, 24, 11);
  scene.add(sun);
  buildViewGun();
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
}

function resize() {
  if (!renderer || !camera) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  const horizontal = fov * Math.PI / 180;
  camera.fov = 2 * Math.atan(Math.tan(horizontal / 2) / (width / height)) * 180 / Math.PI;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function boxGeometryMesh(box, material) {
  const geometry = new THREE.BoxGeometry(box.w, box.h, box.d);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(box.x, box.y + box.h / 2, box.z);
  mesh.receiveShadow = false;
  return mesh;
}

function buildMap(nextMap) {
  initRenderer();
  disposeWorld();
  for (const avatar of avatars.values()) disposeAvatar(avatar);
  avatars.clear();
  map = nextMap;
  world = new THREE.Group();
  scene.add(world);
  const accent = new THREE.Color(map.color);
  scene.background = new THREE.Color(map.sky);
  scene.fog = new THREE.Fog(map.sky, 55, 105);

  const floorMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x1b2638).lerp(accent, .09), roughness: .8, metalness: .25 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(map.bounds.width, map.bounds.depth), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.035;
  world.add(floor);
  const grid = new THREE.GridHelper(Math.max(map.bounds.width, map.bounds.depth), Math.max(map.bounds.width, map.bounds.depth) / 2, accent, 0x33445d);
  grid.position.y = -.015;
  grid.material.transparent = true;
  grid.material.opacity = .35;
  world.add(grid);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x253447, roughness: .55, metalness: .55 });
  const bounds = map.bounds;
  const borders = [
    { x: -bounds.width / 2 - .5, z: 0, w: 1, d: bounds.depth + 2, y: 0, h: 6 },
    { x: bounds.width / 2 + .5, z: 0, w: 1, d: bounds.depth + 2, y: 0, h: 6 },
    { x: 0, z: -bounds.depth / 2 - .5, w: bounds.width + 2, d: 1, y: 0, h: 6 },
    { x: 0, z: bounds.depth / 2 + .5, w: bounds.width + 2, d: 1, y: 0, h: 6 }
  ];
  for (const border of borders) {
    world.add(boxGeometryMesh(border, wallMaterial));
    const trim = boxGeometryMesh({ ...border, y: 4.85, h: .1 },
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .85 }));
    world.add(trim);
  }
  const floorGlow = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .16, depthWrite: false });
  for (const lane of [
    { x: 0, z: 0, w: map.bounds.width - 6, d: .1, y: 0, h: .018 },
    { x: 0, z: 0, w: .1, d: map.bounds.depth - 6, y: 0, h: .018 }
  ]) world.add(boxGeometryMesh(lane, floorGlow));

  const palette = {
    core: 0x41536a, wall: 0x34475d, cover: 0x50667b,
    platform: 0x4b6480, pillar: 0x475269
  };
  for (const box of map.boxes) {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette[box.m] || palette.cover).lerp(accent, .13),
      metalness: box.m === 'pillar' ? .65 : .44, roughness: .48
    });
    const mesh = boxGeometryMesh(box, material);
    world.add(mesh);
    if (box.y === 0 && box.h > 1.3) {
      const inset = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(.3, box.w - .18), .07, Math.max(.3, box.d - .18)),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .32 })
      );
      inset.position.set(box.x, box.y + box.h + .035, box.z);
      world.add(inset);
    }
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: accent.clone().multiplyScalar(.62), transparent: true, opacity: .64 })
    );
    edges.position.copy(mesh.position);
    world.add(edges);
    if (box.m === 'platform') {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(box.w + .04, .07, box.d + .04),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .85 })
      );
      strip.position.set(box.x, box.y + box.h + .04, box.z);
      world.add(strip);
    }
  }
  for (const pad of map.pads) {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.34, 1.34, .08, 32),
      new THREE.MeshStandardMaterial({ color: 0x152b3e, metalness: .65, roughness: .34 })
    );
    base.position.set(pad.x, .04, pad.z);
    world.add(base);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, .075, 8, 32),
      new THREE.MeshBasicMaterial({ color: accent })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pad.x, .095, pad.z);
    world.add(ring);
    const light = new THREE.PointLight(accent, 9, 10, 2);
    light.position.set(pad.x, 2.4, pad.z);
    world.add(light);
  }
  for (const spawn of map.spawns) {
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(.35, .55, 20),
      new THREE.MeshBasicMaterial({ color: 0x78e7d2, side: THREE.DoubleSide, transparent: true, opacity: .6 })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(spawn[0], .012, spawn[2]);
    world.add(marker);
  }
  const core = map.boxes.find(box => box.m === 'core');
  if (core) {
    const beacon = new THREE.Group();
    beacon.position.set(core.x, core.y + core.h + 1.55, core.z);
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(.68, 1),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.2, metalness: .4, roughness: .22 }));
    beacon.add(orb);
    for (const rotation of [0, Math.PI / 2]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, .055, 8, 48),
        new THREE.MeshBasicMaterial({ color: accent }));
      ring.rotation.y = rotation;
      beacon.add(ring);
    }
    const light = new THREE.PointLight(accent, 15, 20, 2);
    beacon.add(light);
    world.add(beacon);
    world.userData.beacon = beacon;
  }
  arenaName.textContent = map.name.toUpperCase();
}

function piece(group, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  return mesh;
}

function buildViewGun() {
  viewGun = new THREE.Group();
  viewGun.position.set(.36, -.34, -.67);
  camera.add(viewGun);
  const body = new THREE.MeshStandardMaterial({ color: 0x31485c, metalness: .7, roughness: .26 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101d2b, metalness: .5, roughness: .46 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x64dffd });
  piece(viewGun, new THREE.BoxGeometry(.25, .17, .58), body, 0, 0, -.18);
  piece(viewGun, new THREE.BoxGeometry(.19, .11, .42), dark, 0, -.08, .12);
  piece(viewGun, new THREE.CylinderGeometry(.07, .09, .43, 10), body, 0, .025, -.53).rotation.x = Math.PI / 2;
  piece(viewGun, new THREE.BoxGeometry(.13, .035, .19), glow, 0, .105, -.21);
  piece(viewGun, new THREE.BoxGeometry(.24, .11, .22), dark, 0, -.12, .15);
  const muzzle = piece(viewGun, new THREE.SphereGeometry(.14, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x9ef7ff, transparent: true, opacity: .9, depthTest: false }), 0, .02, -.8);
  muzzle.visible = false;
  const muzzleLight = new THREE.PointLight(0x86e5ff, 0, 3);
  muzzleLight.position.set(0, .02, -.8);
  viewGun.add(muzzleLight);
  viewGun.userData.glow = glow;
  viewGun.userData.muzzle = muzzle;
  viewGun.userData.muzzleLight = muzzleLight;
}

function avatarColor(id, explicit) {
  if (explicit) return new THREE.Color(explicit);
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const color = new THREE.Color().setHSL((hash % 360) / 360, .72, .56);
  return color;
}

function makeAvatar(id, color, name) {
  const group = new THREE.Group();
  const armor = new THREE.MeshStandardMaterial({ color: avatarColor(id, color), metalness: .48, roughness: .4 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x17263a, metalness: .62, roughness: .4 });
  const visor = new THREE.MeshBasicMaterial({ color: 0x9bf5ff });
  const body = new THREE.Group();
  group.add(body);
  piece(body, new THREE.BoxGeometry(.76, .72, .4), armor, 0, 1.18, 0);
  piece(body, new THREE.BoxGeometry(.66, .24, .4), trim, 0, .8, 0);
  piece(body, new THREE.BoxGeometry(.46, .42, .4), armor, 0, 1.69, 0);
  piece(body, new THREE.BoxGeometry(.4, .1, .035), visor, 0, 1.72, -.22);
  const leftArm = piece(body, new THREE.BoxGeometry(.2, .67, .25), armor, -.51, 1.16, 0);
  const rightArm = piece(body, new THREE.BoxGeometry(.2, .67, .25), armor, .51, 1.16, 0);
  const leftLeg = piece(body, new THREE.BoxGeometry(.26, .72, .31), trim, -.22, .36, 0);
  const rightLeg = piece(body, new THREE.BoxGeometry(.26, .72, .31), trim, .22, .36, 0);
  piece(body, new THREE.BoxGeometry(.14, .14, .55), trim, .44, 1.14, -.35);
  piece(body, new THREE.BoxGeometry(.11, .06, .16), visor, .44, 1.14, -.68);
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 256;
  labelCanvas.height = 64;
  const labelContext = labelCanvas.getContext('2d');
  labelContext.fillStyle = 'rgba(4, 13, 25, .8)';
  labelContext.fillRect(0, 6, 256, 50);
  labelContext.strokeStyle = color || '#72dcff';
  labelContext.lineWidth = 3;
  labelContext.strokeRect(2, 8, 252, 46);
  labelContext.fillStyle = '#f6fbff';
  labelContext.font = 'bold 25px system-ui';
  labelContext.textAlign = 'center';
  labelContext.textBaseline = 'middle';
  labelContext.fillText(name, 128, 32, 234);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthWrite: false }));
  label.position.set(0, 2.34, 0);
  label.scale.set(2.8, .7, 1);
  group.add(label);
  scene.add(group);
  return { group, body, leftArm, rightArm, leftLeg, rightLeg, target: null };
}

function updateAvatars(delta, time) {
  for (const avatar of avatars.values()) {
    const target = avatar.target;
    if (!target) continue;
    avatar.group.visible = target.alive;
    const amount = 1 - Math.exp(-delta * 14);
    avatar.group.position.lerp(new THREE.Vector3(target.x, target.y, target.z), amount);
    let difference = (-target.yaw - avatar.group.rotation.y + Math.PI) % (Math.PI * 2) - Math.PI;
    if (difference < -Math.PI) difference += Math.PI * 2;
    avatar.group.rotation.y += difference * amount;
    const gait = Math.min(1, Math.hypot(target.vx, target.vz) / 10);
    const swing = Math.sin(time * 12) * gait * .42;
    avatar.leftLeg.rotation.x = swing;
    avatar.rightLeg.rotation.x = -swing;
    avatar.leftArm.rotation.x = -swing * .65;
    avatar.rightArm.rotation.x = swing * .65;
    avatar.body.position.y = target.wallRunning ? .05 : Math.abs(Math.sin(time * 12)) * gait * .035;
  }
}

function syncSnapshot(players) {
  const seen = new Set();
  for (const player of players) {
    if (player.id === selfId) {
      if (!local) local = Physics.makePlayer([player.x, player.y, player.z]);
      const distance = Math.hypot(local.x - player.x, local.y - player.y, local.z - player.z);
      if (distance > 3) { local.x = player.x; local.y = player.y; local.z = player.z; local.vx = player.vx; local.vy = player.vy; local.vz = player.vz; }
      else {
        local.x += (player.x - local.x) * .22;
        local.y += (player.y - local.y) * .22;
        local.z += (player.z - local.z) * .22;
        local.vx += (player.vx - local.vx) * .22;
        local.vy += (player.vy - local.vy) * .22;
        local.vz += (player.vz - local.vz) * .22;
      }
      selfAlive = player.alive;
      health.textContent = String(player.health);
      healthMeter.style.width = player.health + '%';
      frags.textContent = String(player.kills);
      deaths.textContent = String(player.deaths);
      streakLabel.textContent = String(player.streak || 0);
      continue;
    }
    seen.add(player.id);
    let avatar = avatars.get(player.id);
    if (!avatar) {
      avatar = makeAvatar(player.id, player.color, player.name + (player.bot ? ' [BOT]' : ''));
      avatar.group.position.set(player.x, player.y, player.z);
      avatar.group.rotation.y = -player.yaw;
      avatars.set(player.id, avatar);
    }
    avatar.target = player;
  }
  for (const [id, avatar] of avatars) {
    if (!seen.has(id)) { disposeAvatar(avatar); avatars.delete(id); }
  }
  leaderboard.replaceChildren();
  for (const player of [...players].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths).slice(0, 8)) {
    const row = document.createElement('div');
    row.className = 'leader-row' + (player.id === selfId ? ' self' : '');
    const name = document.createElement('span');
    name.textContent = player.name + (player.bot ? ' · BOT' : '');
    const score = document.createElement('span');
    score.textContent = player.kills + ' / ' + player.deaths;
    row.append(name, score);
    leaderboard.append(row);
  }
}

function addShot(message) {
  const from = new THREE.Vector3(...message.from);
  const to = new THREE.Vector3(...message.to);
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({
    color: message.weapon === 'rail' ? 0xb8a8ff : 0x64e5ff,
    transparent: true, opacity: 1
  });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  const spark = new THREE.Mesh(new THREE.IcosahedronGeometry(message.weapon === 'rail' ? .21 : .13, 0),
    new THREE.MeshBasicMaterial({ color: message.weapon === 'rail' ? 0xcbb8ff : 0x8df8ff, transparent: true, opacity: .8 }));
  spark.position.copy(to);
  scene.add(spark);
  shotLines.push({ line, spark, time: performance.now() + (message.weapon === 'rail' ? 260 : 115) });
  if (message.id === selfId) {
    recoil = message.weapon === 'rail' ? .13 : .065;
    muzzleUntil = performance.now() + (message.weapon === 'rail' ? 110 : 75);
    playSound(message.weapon);
    if (message.hit) {
      playSound('hit');
      hitMarker.classList.add('visible');
      clearTimeout(addShot.hitTimer);
      addShot.hitTimer = setTimeout(() => hitMarker.classList.remove('visible'), 100);
    }
  }
}

function addKill(message) {
  const line = document.createElement('div');
  line.textContent = message.killer + ' ⚡ ' + message.victim;
  killFeed.prepend(line);
  while (killFeed.children.length > 4) killFeed.lastChild.remove();
  setTimeout(() => line.remove(), 5000);
}

function resetControls() { keys.clear(); mouseDown = false; }
function leaveMatch() {
  if (document.pointerLockElement) document.exitPointerLock();
  if (socket) { socket.onclose = null; socket.close(); socket = null; }
  room = null;
  selfId = null;
  local = null;
  selfAlive = false;
  map = null;
  disposeWorld();
  for (const avatar of avatars.values()) disposeAvatar(avatar);
  avatars.clear();
  resetControls();
  browser.hidden = false;
  pause.hidden = true;
  hud.hidden = true;
  $('menu-button').hidden = true;
  document.body.classList.remove('playing');
  setConnection('Offline');
  history.replaceState(null, '', location.pathname);
  refreshRooms();
}

function joinRoom(id) {
  clearError();
  if (socket) socket.close();
  const name = rememberName();
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = protocol + '//' + location.host + '/api/arena/ws?room=' + encodeURIComponent(id) + '&name=' + encodeURIComponent(name);
  let welcomed = false;
  setConnection('Connecting…');
  const connectionSocket = new WebSocket(url);
  socket = connectionSocket;
  connectionSocket.onmessage = event => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.t === 'welcome') {
      welcomed = true;
      selfId = message.id;
      room = message.room;
      try { buildMap(message.map); }
      catch (error) {
        welcomed = false;
        showError('3D rendering is unavailable. Enable WebGL in your browser and try again.');
        connectionSocket.close();
        return;
      }
      const state = message.self;
      local = Physics.makePlayer([state.x, state.y, state.z]);
      Object.assign(local, { vx: state.vx, vy: state.vy, vz: state.vz, yaw: state.yaw, pitch: state.pitch });
      yaw = state.yaw;
      pitch = state.pitch;
      selfAlive = true;
      browser.hidden = true;
      pause.hidden = false;
      hud.hidden = false;
      $('menu-button').hidden = false;
      $('pause-room-name').textContent = room.name + ' · ' + room.mapName;
      setConnection(room.players + ' / ' + room.maxPlayers + ' players · ' + (room.bots || 0) + ' bots', true);
      history.replaceState(null, '', location.pathname + '?room=' + encodeURIComponent(room.id));
      toast('Connected. Click Resume and move with WASD.');
    } else if (message.t === 'snapshot') {
      if (scene) syncSnapshot(message.players);
      if (room) {
        room.players = message.players.filter(player => !player.bot).length;
        room.bots = message.players.length - room.players;
        setConnection(room.players + ' / ' + room.maxPlayers + ' players · ' + room.bots + ' bots', true);
      }
    } else if (message.t === 'respawn' && message.state.id === selfId) {
      const state = message.state;
      local = Physics.makePlayer([state.x, state.y, state.z]);
      yaw = state.yaw;
      pitch = state.pitch;
      selfAlive = true;
      toast('Respawned');
    } else if (message.t === 'shot' && scene) addShot(message);
    else if (message.t === 'frag') {
      addKill(message);
      if (message.victimId === selfId) { toast('Fragged by ' + message.killer + ' — respawning'); playSound('death'); }
      else if (message.killerId === selfId) { toast(message.streak > 1 ? message.streak + ' FRAG STREAK · +25 HEALTH' : 'FRAG · +25 HEALTH'); playSound('frag'); }
    } else if (message.t === 'ready') {
      toast('Spawn shield for 2 seconds');
    } else if (message.t === 'heal') {
      health.textContent = String(message.health);
      healthMeter.style.width = message.health + '%';
    } else if (message.t === 'damage') {
      health.textContent = String(message.health);
      healthMeter.style.width = message.health + '%';
      damageFlash.classList.add('visible');
      clearTimeout(connectionSocket.damageTimer);
      connectionSocket.damageTimer = setTimeout(() => damageFlash.classList.remove('visible'), 170);
    } else if (message.t === 'presence') {
      toast(message.name + ' ' + message.action);
    }
  };
  connectionSocket.onerror = () => { if (!welcomed) showError('Could not connect to that room. It may be full or expired.'); };
  connectionSocket.onclose = () => {
    if (socket !== connectionSocket) return;
    socket = null;
    if (welcomed) { leaveMatch(); showError('Connection lost. Rejoin from the server browser.'); }
    else { setConnection('Offline'); refreshRooms(); }
  };
}

function inputState() {
  const active = document.pointerLockElement === renderer?.domElement;
  return {
    forward: active && (keys.has('KeyW') || keys.has('ArrowUp')),
    back: active && (keys.has('KeyS') || keys.has('ArrowDown')),
    left: active && (keys.has('KeyA') || keys.has('ArrowLeft')),
    right: active && (keys.has('KeyD') || keys.has('ArrowRight')),
    jump: active && keys.has('Space'),
    yaw, pitch
  };
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!renderer || !scene || !camera) return;
  const delta = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (map && local) {
    const input = inputState();
    accumulator = Math.min(.1, accumulator + delta);
    while (accumulator >= Physics.TICK) {
      if (selfAlive) Physics.step(local, input, map, Physics.TICK);
      accumulator -= Physics.TICK;
    }
    if (now - inputSendAt >= 30) {
      send({ t: 'input', ...input });
      inputSendAt = now;
    }
    if (mouseDown && document.pointerLockElement === renderer.domElement && selfAlive && now - fireSendAt > 30) {
      send({ t: 'fire', weapon: currentWeapon, yaw, pitch });
      fireSendAt = now;
    }
    const speed = Math.hypot(local.vx, local.vz);
    const bob = local.grounded ? Math.sin(now * .016 * Math.max(2, speed)) * Math.min(.026, speed * .0016) : 0;
    camera.position.set(local.x, local.y + Physics.EYE + bob, local.z);
    const targetRoll = local.wallRunning ? (local.wallNormalX * .09 + local.wallNormalZ * .035) : 0;
    camera.rotation.set(pitch, -yaw, targetRoll, 'YXZ');
    speedLabel.textContent = Math.round(Math.hypot(local.vx, local.vz)).toString();
    movementMode.textContent = local.wallRunning ? 'WALL RUN' : !local.grounded ? (local.jumpsUsed > 1 ? 'DOUBLE JUMP' : 'AIRBORNE') : 'GROUND';
  }
  const time = now / 1000;
  if (world?.userData.beacon) world.userData.beacon.rotation.y = time * .5;
  updateAvatars(delta, time);
  for (let index = shotLines.length - 1; index >= 0; index--) {
    const shot = shotLines[index];
    if (now >= shot.time) {
      scene.remove(shot.line);
      shot.line.geometry.dispose();
      shot.line.material.dispose();
      scene.remove(shot.spark);
      shot.spark.geometry.dispose();
      shot.spark.material.dispose();
      shotLines.splice(index, 1);
    } else {
      shot.line.material.opacity = Math.min(1, (shot.time - now) / 90);
    }
  }
  if (viewGun) {
    recoil = Math.max(0, recoil - delta * .6);
    viewGun.position.z = -.67 + recoil;
    viewGun.visible = Boolean(map && browser.hidden);
    viewGun.userData.glow.color.setHex(currentWeapon === 'rail' ? 0xb8a8ff : 0x64dffd);
    viewGun.userData.muzzle.visible = now < muzzleUntil;
    viewGun.userData.muzzleLight.intensity = now < muzzleUntil ? 4 : 0;
  }
  renderer.render(scene, camera);
}

function selectWeapon(weapon) {
  currentWeapon = weapon;
  $('weapon-name').textContent = weapon === 'rail' ? 'RAIL CANNON' : 'PULSE BLASTER';
  $('weapon-help').textContent = weapon === 'rail' ? '2 · precision shot' : '1 · rapid fire';
  send({ t: 'weapon', weapon });
}

document.addEventListener('keydown', event => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
  if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
  if (event.code === 'Digit1') selectWeapon('pulse');
  if (event.code === 'Digit2') selectWeapon('rail');
  if (event.code === 'KeyQ') selectWeapon(currentWeapon === 'pulse' ? 'rail' : 'pulse');
  keys.add(event.code);
});
document.addEventListener('keyup', event => { keys.delete(event.code); });
document.addEventListener('mousemove', event => {
  if (document.pointerLockElement !== renderer?.domElement) return;
  yaw += event.movementX * .0023;
  pitch = Math.max(-1.45, Math.min(1.45, pitch - event.movementY * .0023));
});
document.addEventListener('pointerlockchange', () => {
  const active = document.pointerLockElement === renderer?.domElement;
  document.body.classList.toggle('playing', active);
  if (!room) return;
  if (active) send({ t: 'ready' });
  pause.hidden = active;
  if (!active) resetControls();
});
document.addEventListener('mousedown', event => {
  if (event.button === 0 && document.pointerLockElement === renderer?.domElement) mouseDown = true;
});
document.addEventListener('mouseup', event => { if (event.button === 0) mouseDown = false; });
document.addEventListener('contextmenu', event => { if (room) event.preventDefault(); });
window.addEventListener('blur', resetControls);
$('resume').addEventListener('click', () => { playSound('start'); renderer?.domElement.requestPointerLock(); });
$('menu-button').addEventListener('click', () => {
  if (document.pointerLockElement) document.exitPointerLock();
  else if (room) pause.hidden = false;
});
$('leave').addEventListener('click', leaveMatch);
$('copy-link').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); toast('Room link copied'); }
  catch { toast('Could not copy the room link'); }
});
$('refresh-rooms').addEventListener('click', refreshRooms);
$('host-room').addEventListener('click', hostRoom);
fovInput.addEventListener('input', () => {
  fov = Number(fovInput.value);
  fovValue.textContent = fov + '°';
  try { localStorage.setItem('arena-fov', String(fov)); } catch {}
  resize();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) resetControls(); });

refreshRooms();
roomRefreshTimer = setInterval(refreshRooms, 5000);
const requestedRoom = new URLSearchParams(location.search).get('room');
if (requestedRoom) setTimeout(() => joinRoom(requestedRoom), 350);
