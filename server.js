'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.K_SERVICE ? '0.0.0.0' : (process.env.HOST || '127.0.0.1');
const RELEASE_REPOSITORY = process.env.LIMA_RELEASE_REPOSITORY || 'hosfeldli/ray-placement';
const RELEASE_API = `https://api.github.com/repos/${RELEASE_REPOSITORY}/releases/latest`;
const RELEASE_CACHE_MS = 5 * 60 * 1000;
let cachedRelease = null;
let cachedAt = 0;
const MIME_TYPES = Object.freeze({ '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.dmg': 'application/x-apple-diskimage' });
const PUBLIC_FILES = new Set(['/styles.css', '/script.js', '/extensions.html', '/extensions.css', '/extensions.js', '/robots.txt', '/sitemap.xml', '/assets/favicon.svg', '/assets/og-image.png', '/docs/EXTENSION_AUTHORING_FOR_AI.md', '/docs/EXTENSIONS.md', '/docs/extension-manifest.schema.json', '/docs/starter-extension/manifest.json']);
function headers(type, cache = 'no-cache') { return { 'Content-Type': type, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' }; }
function send(res, status, body, type = 'text/plain; charset=utf-8') { res.writeHead(status, { ...headers(type), 'Content-Length': Buffer.byteLength(body) }); res.end(body); }
function sendJSON(res, status, value) { const body = JSON.stringify(value, null, 2); res.writeHead(status, headers('application/json; charset=utf-8', 'public, max-age=300')); res.end(body); }
async function latestRelease() {
  if (cachedRelease && Date.now() - cachedAt < RELEASE_CACHE_MS) return cachedRelease;
  const response = await fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'lima-site' }, signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error(`Release source returned ${response.status}`);
  const release = await response.json();
  const asset = (names) => release.assets?.find((item) => names.includes(item.name));
  const dmg = asset(['Lima.dmg', 'LiamFlow.dmg', 'LiamFlow-Installer.dmg']);
  const update = asset(['Lima-Update.zip', 'LiamFlow-Update.zip', 'RayPlacement-Update.zip']);
  cachedRelease = {
    version: release.tag_name || 'Latest release',
    publishedAt: release.published_at,
    releaseUrl: release.html_url,
    dmg: dmg?.browser_download_url || release.html_url,
    update: update?.browser_download_url || null,
    updateDigest: update?.digest || null,
    updateSize: update?.size || null,
  };
  cachedAt = Date.now();
  return cachedRelease;
}
function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : (pathname === '/extensions' || pathname === '/extensions/' ? '/extensions.html' : pathname);
  if (requested !== '/index.html' && !PUBLIC_FILES.has(requested)) return send(res, 404, 'Not found');
  const filePath = path.join(ROOT, requested.slice(1));
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) return send(res, 404, 'Not found');
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { ...headers(type, requested === '/index.html' ? 'no-cache' : 'public, max-age=3600'), 'Content-Length': stats.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).on('error', () => res.destroy()).pipe(res);
  });
}
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, 'Method not allowed');
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/updates/latest.json' || url.pathname === '/api/updates/latest') { try { return sendJSON(res, 200, await latestRelease()); } catch { return sendJSON(res, 503, { error: 'Release information is temporarily unavailable.' }); } }
  if (url.pathname === '/downloads/Lima.dmg' || url.pathname === '/downloads/LiamFlow.dmg') { try { const release = await latestRelease(); res.writeHead(302, { Location: release.dmg, 'Cache-Control': 'no-store' }); return res.end(); } catch { return send(res, 503, 'The Lima download is temporarily unavailable.'); } }
  return serveStatic(req, res, url.pathname);
});
server.listen(PORT, HOST, () => console.log(`Lima site running at http://${HOST}:${PORT}`));
