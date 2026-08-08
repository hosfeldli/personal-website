'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { URL } = require('node:url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.K_SERVICE ? '0.0.0.0' : (process.env.HOST || '127.0.0.1');
const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript))/;
const COMPRESS_MIN_BYTES = 1024;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const PUBLIC_FILES = new Set([
  '/styles.css',
  '/refined.css',
  '/game.js',
  '/script.js',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]);

function sendText(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function resolveStaticFile(pathname) {
  if (pathname === '/') return path.join(ROOT, 'index.html');
  if (PUBLIC_FILES.has(pathname)) return path.join(ROOT, pathname.slice(1));
  if (pathname.startsWith('/assets/')) {
    const resolved = path.normalize(path.join(ROOT, pathname.replace(/^\/+/, '')));
    const assetsRoot = `${path.join(ROOT, 'assets')}${path.sep}`;
    return resolved.startsWith(assetsRoot) ? resolved : null;
  }
  return null;
}

function cacheControlFor(pathname, isFingerprinted) {
  if (isFingerprinted) return 'public, max-age=31536000, immutable';
  if (pathname.startsWith('/assets/')) return 'public, max-age=604800, stale-while-revalidate=86400';
  if (pathname.endsWith('.css') || pathname.endsWith('.js')) return 'public, max-age=3600, must-revalidate';
  return 'no-cache';
}

function serveStatic(req, res, pathname) {
  const filePath = resolveStaticFile(pathname);
  if (!filePath) return sendText(res, 404, 'Not found');

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) return sendText(res, 404, 'Not found');
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    const etag = `W/"${stats.size.toString(16)}-${stats.mtimeMs.toString(36)}"`;
    const isFingerprinted = /\.[0-9a-f]{8,}\.(css|js|png|jpg|webp|svg)$/i.test(pathname);
    const headers = {
      'Content-Type': type,
      'Cache-Control': cacheControlFor(pathname, isFingerprinted),
      'ETag': etag,
      'Last-Modified': stats.mtime.toUTCString(),
      'Vary': 'Accept-Encoding',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch.split(',').some((value) => value.trim() === etag)) {
      res.writeHead(304, headers);
      return res.end();
    }

    const accepted = String(req.headers['accept-encoding'] || '');
    const compressible = COMPRESSIBLE.test(type) && stats.size >= COMPRESS_MIN_BYTES;
    const encoding = !compressible ? null
      : /\bbr\b/.test(accepted) ? 'br'
      : /\bgzip\b/.test(accepted) ? 'gzip'
      : null;

    if (!encoding) headers['Content-Length'] = stats.size;
    else headers['Content-Encoding'] = encoding;

    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.destroy());
    if (!encoding) return stream.pipe(res);
    const compressor = encoding === 'br'
      ? zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
      : zlib.createGzip({ level: 6 });
    stream.pipe(compressor).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (['GET', 'HEAD'].includes(req.method)) return serveStatic(req, res, url.pathname);
  return sendText(res, 405, 'Method not allowed');
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; draining requests`);
  server.close(() => {
    console.log('Pending requests flushed; exiting');
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, HOST, () => {
  console.log(`Portfolio running at http://${HOST}:${PORT}`);
});
