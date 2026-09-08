'use strict';
const http = require('node:http');
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');
const { finished } = require('node:stream/promises');
const Busboy = require('busboy');
const {
  LIMITS,
  SubmissionValidationError,
  inspectExtensionArchive,
  saveSubmission,
} = require('./lib/extension-submissions');
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.K_SERVICE ? '0.0.0.0' : (process.env.HOST || '127.0.0.1');
const RELEASE_REPOSITORY = process.env.LIMA_RELEASE_REPOSITORY || 'hosfeldli/ray-placement';
const RELEASE_API = `https://api.github.com/repos/${RELEASE_REPOSITORY}/releases/latest`;
const GITHUB_BRANCH = process.env.LIMA_GITHUB_BRANCH || 'main';
const EXTENSION_GUIDE_PATH = process.env.LIMA_EXTENSION_GUIDE_PATH || 'docs/EXTENSIONS.md';
const EXTENSION_GUIDE_SOURCE = `https://github.com/${RELEASE_REPOSITORY}/blob/${GITHUB_BRANCH}/${EXTENSION_GUIDE_PATH}`;
const EXTENSION_GUIDE_RAW = `https://raw.githubusercontent.com/${RELEASE_REPOSITORY}/${GITHUB_BRANCH}/${EXTENSION_GUIDE_PATH}`;
const RELEASE_CACHE_MS = 5 * 60 * 1000;
const SUBMISSION_LIMIT = LIMITS.compressedBytes + 1 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
let cachedRelease = null;
let cachedAt = 0;
let cachedExtensionGuide = null;
let cachedExtensionGuideAt = 0;
const submissionRate = new Map();
const MIME_TYPES = Object.freeze({ '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.dmg': 'application/x-apple-diskimage' });
const PUBLIC_FILES = new Set(['/index.html', '/styles.css', '/theme.css', '/script.js', '/extensions.html', '/extensions.css', '/extensions.js', '/robots.txt', '/sitemap.xml', '/assets/favicon.svg', '/assets/og-image.png', '/docs/EXTENSION_AUTHORING_FOR_AI.md', '/docs/EXTENSIONS.md', '/docs/extension-manifest.schema.json', '/docs/starter-extension/manifest.json', '/store/extensions.json']);
function headers(type, cache = 'no-cache') { return { 'Content-Type': type, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'" }; }
function send(res, status, body, type = 'text/plain; charset=utf-8') { res.writeHead(status, { ...headers(type), 'Content-Length': Buffer.byteLength(body) }); res.end(body); }
function sendJSON(res, status, value) { const body = JSON.stringify(value, null, 2); res.writeHead(status, { ...headers('application/json; charset=utf-8'), 'Content-Length': Buffer.byteLength(body) }); res.end(body); }
function requestIP(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim().slice(0, 128); }
function allowedSubmission(req) {
  const key = requestIP(req);
  const now = Date.now();
  const recent = (submissionRate.get(key) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  submissionRate.set(key, recent);
  if (submissionRate.size > 10000) for (const [ip, timestamps] of submissionRate) if (!timestamps.some((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)) submissionRate.delete(ip);
  return true;
}
async function latestRelease() {
  if (cachedRelease && Date.now() - cachedAt < RELEASE_CACHE_MS) return cachedRelease;
  const response = await fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'lima-site' }, signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error(`Release source returned ${response.status}`);
  const release = await response.json();
  const asset = (names) => release.assets?.find((item) => names.includes(item.name));
  const dmg = asset(['Lima.dmg', 'LiamFlow.dmg', 'LiamFlow-Installer.dmg']);
  const update = asset(['Lima-Update.zip', 'LiamFlow-Update.zip', 'RayPlacement-Update.zip']);
  cachedRelease = { version: release.tag_name || 'Latest release', publishedAt: release.published_at, releaseUrl: release.html_url, dmg: dmg?.browser_download_url || release.html_url, update: update?.browser_download_url || null, updateDigest: update?.digest || null, updateSize: update?.size || null };
  cachedAt = Date.now();
  return cachedRelease;
}
async function extensionGuide() {
  if (cachedExtensionGuide && Date.now() - cachedExtensionGuideAt < RELEASE_CACHE_MS) return cachedExtensionGuide;
  try {
    const response = await fetch(EXTENSION_GUIDE_RAW, { headers: { Accept: 'text/plain', 'User-Agent': 'lima-site' }, signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(`Guide source returned ${response.status}`);
    const content = await response.text();
    if (!content.trim()) throw new Error('Guide source returned an empty document');
    cachedExtensionGuide = { repository: RELEASE_REPOSITORY, branch: GITHUB_BRANCH, path: EXTENSION_GUIDE_PATH, sourceUrl: EXTENSION_GUIDE_SOURCE, rawUrl: EXTENSION_GUIDE_RAW, fetchedAt: new Date().toISOString(), content };
    cachedExtensionGuideAt = Date.now();
    return cachedExtensionGuide;
  } catch (error) {
    if (cachedExtensionGuide) return { ...cachedExtensionGuide, stale: true };
    throw error;
  }
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
function parseSubmission(req) {
  return new Promise((resolve, reject) => {
    const contentType = String(req.headers['content-type'] || '');
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) return reject(new SubmissionValidationError('Submit a ZIP file using multipart/form-data.', 'invalid_request'));
    const contentLength = Number(req.headers['content-length'] || 0);
    if (Number.isSafeInteger(contentLength) && contentLength > SUBMISSION_LIMIT + 128 * 1024) return reject(new SubmissionValidationError('The upload request is too large.', 'invalid_request'));
    let parser;
    try { parser = Busboy({ headers: req.headers, limits: { fileSize: SUBMISSION_LIMIT, files: 1, fields: 4, fieldSize: 512, parts: 5 } }); } catch { return reject(new SubmissionValidationError('The upload request is malformed.', 'invalid_request')); }
    const temporary = path.join(require('node:os').tmpdir(), `lima-extension-upload-${crypto.randomUUID()}.zip`);
    let stream;
    let writeDone;
    let fileName = '';
    let fileBytes = 0;
    let truncated = false;
    let ended = false;
    const fields = {};
    const cleanup = async () => { try { await fsp.rm(temporary, { force: true }); } catch {} };
    const fail = async (error) => { if (ended) return; ended = true; req.unpipe(parser); parser.destroy(); stream?.destroy(); await cleanup(); reject(error); };
    parser.on('field', (name, value, info) => {
      if (ended) return;
      if (info?.valueTruncated) return void fail(new SubmissionValidationError('A form field is too large.'));
      fields[name] = value;
    });
    parser.on('file', (name, incoming, info) => {
      if (name !== 'package') { incoming.resume(); return; }
      if (stream) { incoming.resume(); return void fail(new SubmissionValidationError('Only one package may be submitted.')); }
      fileName = String(info.filename || '');
      stream = fs.createWriteStream(temporary, { flags: 'wx', mode: 0o600 });
      writeDone = finished(stream);
      incoming.on('data', (chunk) => { fileBytes += chunk.length; });
      incoming.on('limit', () => { truncated = true; });
      incoming.on('error', (error) => fail(error));
      incoming.pipe(stream);
    });
    parser.on('filesLimit', () => fail(new SubmissionValidationError('Only one package may be submitted.')));
    parser.on('partsLimit', () => fail(new SubmissionValidationError('The submission contains too many parts.')));
    parser.on('error', (error) => fail(new SubmissionValidationError(`The upload could not be read: ${error.message}`)));
    parser.on('finish', async () => {
      if (ended) return;
      if (writeDone) {
        try { await writeDone; } catch (error) { return fail(new SubmissionValidationError(`The upload could not be stored: ${error.message}`)); }
      }
      if (truncated || fileBytes > LIMITS.compressedBytes) return fail(new SubmissionValidationError(`Packages must be ZIP files no larger than ${Math.floor(LIMITS.compressedBytes / 1024 / 1024)} MB.`));
      if (!stream || !fileName) return fail(new SubmissionValidationError('Choose one ZIP package to submit.'));
      ended = true;
      resolve({ temporary, fileName, fields });
    });
    req.on('aborted', () => fail(new SubmissionValidationError('The upload was interrupted.')));
    req.pipe(parser);
  });
}
async function submitExtension(req, res) {
  if (!allowedSubmission(req)) return sendJSON(res, 429, { error: 'Too many submissions from this address. Try again later.' });
  let parsed;
  try {
    parsed = await parseSubmission(req);
    if (String(parsed.fields.website || '').trim()) {
      await fsp.rm(parsed.temporary, { force: true });
      return sendJSON(res, 202, { status: 'discarded', message: 'Submission received.' });
    }
    const inspection = await inspectExtensionArchive(parsed.temporary);
    const metadata = { originalFilename: parsed.fileName.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 160), manifest: inspection.manifest, capabilities: inspection.capabilities, size: inspection.size, sha256: inspection.sha256, entryCount: inspection.entries.length, extractedBytes: inspection.totalUncompressed, submitterNote: String(parsed.fields.note || '').slice(0, 1000) };
    const stored = await saveSubmission(parsed.temporary, metadata);
    await fsp.rm(parsed.temporary, { force: true });
    return sendJSON(res, 202, { submissionID: stored.id, status: 'pending-review', message: 'Package accepted for manual review. It is quarantined and is not publicly listed or installable.' });
  } catch (error) {
    if (parsed?.temporary) await fsp.rm(parsed.temporary, { force: true });
    const status = error instanceof SubmissionValidationError ? 400 : 503;
    return sendJSON(res, status, { error: error instanceof SubmissionValidationError ? error.message : 'The submission service is temporarily unavailable.' });
  }
}
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url?.split('?')[0] === '/api/extensions/submit') return submitExtension(req, res);
  if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, 'Method not allowed');
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/updates/latest.json' || url.pathname === '/api/updates/latest') { try { return sendJSON(res, 200, await latestRelease()); } catch { return sendJSON(res, 503, { error: 'Release information is temporarily unavailable.' }); } }
  if (url.pathname === '/api/extensions/guide') { try { return sendJSON(res, 200, await extensionGuide()); } catch { return sendJSON(res, 503, { error: 'The GitHub extension guide is temporarily unavailable.', sourceUrl: EXTENSION_GUIDE_SOURCE }); } }
  if (url.pathname === '/api/extensions/guide/raw') { try { const guide = await extensionGuide(); return send(res, 200, guide.content, 'text/markdown; charset=utf-8'); } catch { return send(res, 503, 'The GitHub extension guide is temporarily unavailable.'); } }
  if (url.pathname.startsWith('/store/packages/') && url.pathname.endsWith('.zip')) {
    const requested = url.pathname.slice('/store/packages/'.length);
    if (!/^[a-z0-9][a-z0-9.-]*\.zip$/i.test(requested)) return send(res, 404, 'Not found');
    const filePath = path.join(ROOT, 'store', 'packages', requested);
    fs.stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) return send(res, 404, 'Not found');
      res.writeHead(200, { ...headers('application/zip', 'public, max-age=3600'), 'Content-Length': stats.size, 'Content-Disposition': `attachment; filename="${requested}"` });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(filePath).on('error', () => res.destroy()).pipe(res);
    });
    return;
  }
  if (url.pathname === '/downloads/Lima.dmg' || url.pathname === '/downloads/LiamFlow.dmg') { try { const release = await latestRelease(); res.writeHead(302, { Location: release.dmg, 'Cache-Control': 'no-store' }); return res.end(); } catch { return send(res, 503, 'The Lima download is temporarily unavailable.'); } }
  return serveStatic(req, res, url.pathname);
});
server.listen(PORT, HOST, () => console.log(`Lima site running at http://${HOST}:${PORT}`));
