'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const path = require('node:path');

async function unusedPort() {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  listener.close();
  await once(listener, 'close');
  return port;
}

async function startSite(t, env, readyPath) {
  const port = await unusedPort();
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', ...env },
    stdio: 'ignore'
  });
  t.after(() => { child.kill(); });
  const base = 'http://127.0.0.1:' + port;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(base + readyPath)).status < 500) return base; } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.fail('local server should start');
}

test('SITE_MODE=arena serves only the game at the root, with both Three.js modules and the room browser', async t => {
  const base = await startSite(t, { SITE_MODE: 'arena' }, '/api/arena/rooms');

  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /arena\/client\.js/);
  assert.match(home.headers.get('content-security-policy'), /connect-src 'self' ws: wss:/);
  assert.equal((await fetch(base + '/arena')).status, 200);

  for (const route of ['/arena/client.js', '/arena/physics.js', '/arena/style.css', '/vendor/three.module.js', '/vendor/three.core.js', '/assets/favicon.svg']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.ok(Number(response.headers.get('content-length')) > 0, route);
  }

  const browser = await (await fetch(base + '/api/arena/rooms')).json();
  assert.equal(browser.rooms[0].id, 'quickplay');
  assert.equal(browser.maps.length, 3);

  for (const route of ['/index.html', '/docs', '/extensions', '/downloads/Lima.dmg', '/updates/latest.json', '/game.js', '/assets/sprites/enemies-ogdoom.png']) {
    assert.equal((await fetch(base + route)).status, 404, route + ' must not be served by the game');
  }
});

test('the default (Lima) mode serves the Lima site and exposes no arena routes', async t => {
  const base = await startSite(t, { SITE_MODE: '' }, '/');

  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.doesNotMatch(html, /arena/i);

  for (const route of ['/arena', '/arena/', '/arena/client.js', '/arena/index.html', '/vendor/three.module.js', '/api/arena/rooms']) {
    assert.equal((await fetch(base + route)).status, 404, route);
  }
  assert.equal((await fetch(base + '/docs')).status, 200);
});
