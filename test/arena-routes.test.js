'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { once } = require('node:events');
const { spawn } = require('node:child_process');

async function unusedPort() {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  listener.close();
  await once(listener, 'close');
  return port;
}

test('site serves Arena, both Three.js modules, and the room browser without exposing legacy sprites', async t => {
  const port = await unusedPort();
  const child = spawn(process.execPath, ['server.js'], {
    cwd: require('node:path').join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
    stdio: 'ignore'
  });
  t.after(() => { child.kill(); });
  const base = 'http://127.0.0.1:' + port;
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(base + '/api/arena/rooms')).ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.ok(ready, 'local site should start');

  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /href="\/arena"/);

  const arena = await fetch(base + '/arena');
  assert.equal(arena.status, 200);
  assert.match(await arena.text(), /arena\/client\.js/);
  assert.match(arena.headers.get('content-security-policy'), /connect-src 'self' ws: wss:/);

  for (const route of ['/arena/client.js', '/arena/physics.js', '/arena/style.css', '/vendor/three.module.js', '/vendor/three.core.js']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.ok(Number(response.headers.get('content-length')) > 0, route);
  }

  const browser = await (await fetch(base + '/api/arena/rooms')).json();
  assert.equal(browser.rooms[0].id, 'quickplay');
  assert.equal(browser.maps.length, 3);
  assert.equal((await fetch(base + '/game.js')).status, 404);
  assert.equal((await fetch(base + '/assets/sprites/enemies-ogdoom.png')).status, 404);
});
