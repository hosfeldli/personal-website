'use strict';

// Optional local visual QA. Run with: node scripts/visual-check-arena.js
// Requires Chrome/Chromium and writes screenshots to a temporary directory.
const fs = require('node:fs');
const fsp = fs.promises;
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const WebSocket = require('ws');

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function freePort() {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  listener.close();
  await once(listener, 'close');
  return port;
}

async function waitUntil(predicate, label, attempts = 100, delay = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const value = await predicate();
    if (value) return value;
    await sleep(delay);
  }
  throw new Error('Timed out waiting for ' + label);
}

function chromeBinary() {
  const candidates = [
    process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate));
}

function makeCDP(socket) {
  let identifier = 0;
  const pending = new Map();
  const errors = [];
  socket.on('message', raw => {
    const message = JSON.parse(raw.toString());
    if (message.id) {
      const waiter = pending.get(message.id);
      if (!waiter) return;
      pending.delete(message.id);
      clearTimeout(waiter.timer);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || 'JavaScript exception');
    }
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      errors.push(message.params.entry.text);
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map(arg => arg.value || arg.description || '').join(' '));
    }
  });
  const command = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++identifier;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('DevTools timed out: ' + method));
    }, 10000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  return { command, errors };
}

async function main() {
  const chromePath = chromeBinary();
  if (!chromePath) throw new Error('Chrome/Chromium is needed for visual QA.');
  const port = await freePort();
  const origin = 'http://127.0.0.1:' + port;
  const output = process.env.ARENA_VISUAL_OUTPUT || path.join(os.tmpdir(), 'arena-visual-check-' + Date.now());
  const profile = await fsp.mkdtemp(path.join(os.tmpdir(), 'arena-chrome-'));
  await fsp.mkdir(output, { recursive: true });
  let site;
  let chrome;
  let browserSocket;
  let chromeErrors = '';
  try {
    site = spawn(process.execPath, ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    await waitUntil(async () => {
      try { return (await fetch(origin + '/api/arena/rooms')).ok; }
      catch { return false; }
    }, 'local site', 80);

    chrome = spawn(chromePath, [
      '--headless=new', '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader', '--window-size=1440,900',
      '--user-data-dir=' + profile, '--remote-debugging-port=0', 'about:blank'
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    chrome.stderr.on('data', chunk => { chromeErrors = (chromeErrors + chunk).slice(-4000); });
    const portFile = path.join(profile, 'DevToolsActivePort');
    await waitUntil(() => fs.existsSync(portFile), 'Chrome DevTools port', 200);
    const [debugPort, endpoint] = (await fsp.readFile(portFile, 'utf8')).trim().split('\n');
    browserSocket = new WebSocket('ws://127.0.0.1:' + debugPort + endpoint);
    await once(browserSocket, 'open');
    const cdp = makeCDP(browserSocket);
    const target = (await cdp.command('Target.createTarget', { url: 'about:blank' })).targetId;
    const sessionId = (await cdp.command('Target.attachToTarget', { targetId: target, flatten: true })).sessionId;
    const command = (method, params = {}) => cdp.command(method, params, sessionId);
    await command('Runtime.enable');
    await command('Log.enable');
    await command('Page.enable');
    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    const evaluate = async expression => {
      const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const waitForPage = (expression, label) => waitUntil(async () => {
      try { return await evaluate(expression); }
      catch { return false; }
    }, label, 100, 150);
    const screenshot = async name => {
      const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const targetPath = path.join(output, name + '.png');
      await fsp.writeFile(targetPath, Buffer.from(result.data, 'base64'));
      return targetPath;
    };
    const click = async selector => {
      const rectangle = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x:r.x+r.width/2, y:r.y+r.height/2 }; })()`);
      await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: rectangle.x, y: rectangle.y, button: 'left', clickCount: 1 });
      await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rectangle.x, y: rectangle.y, button: 'left', clickCount: 1 });
    };
    const navigate = async url => { await command('Page.navigate', { url }); };

    await navigate(origin + '/arena');
    await waitForPage('document.querySelector("#room-list")?.textContent.includes("Quickplay")', 'Quickplay server listing');
    const screenshots = [await screenshot('browser-desktop')];
    await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    screenshots.push(await screenshot('browser-mobile'));
    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    for (const mapId of ['foundry', 'skybridge', 'citadel']) {
      let roomId = 'quickplay';
      if (mapId !== 'foundry') {
        const response = await fetch(origin + '/api/arena/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Visual QA ' + mapId, mapId, hostName: 'QA', maxPlayers: 4, bots: 2 })
        });
        if (!response.ok) throw new Error('Could not host ' + mapId + ': ' + response.status);
        roomId = (await response.json()).room.id;
      }
      await navigate(origin + '/arena?room=' + roomId);
      await waitForPage('Boolean(document.querySelector("#viewport canvas")) && document.querySelector("#arena-name")?.textContent !== "ARENA"', mapId + ' 3D canvas');
      await waitForPage('document.querySelector("#leaderboard")?.textContent.includes("BOT")', mapId + ' training bots');
      await click('#resume');
      await sleep(1100);
      screenshots.push(await screenshot('match-' + mapId));
      const state = await evaluate('({map:document.querySelector("#arena-name").textContent,players:document.querySelector("#leaderboard").textContent,canvas:!!document.querySelector("#viewport canvas"),connection:document.querySelector("#connection").textContent})');
      if (!state.canvas || !state.players.includes('BOT')) throw new Error('Match did not render bots: ' + mapId);
      console.log(JSON.stringify({ mapId, state }));
    }
    const fatal = cdp.errors.filter(error => !/favicon/i.test(error));
    if (fatal.length) throw new Error('Browser errors: ' + fatal.slice(0, 4).join(' | '));
    console.log(JSON.stringify({ result: 'PASS', output, screenshots }));
  } catch (error) {
    console.error(JSON.stringify({ result: 'FAIL', error: error.message, chromeErrors: chromeErrors.slice(-800), output }));
    process.exitCode = 1;
  } finally {
    browserSocket?.close();
    chrome?.kill();
    site?.kill();
    await sleep(400);
    await fsp.rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }).catch(() => {});
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
