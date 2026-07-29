'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.ndjson');
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.K_SERVICE ? '0.0.0.0' : (process.env.HOST || '127.0.0.1');
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
const ANALYTICS_DATASET = process.env.ANALYTICS_DATASET || '';
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'events';
const USE_BIGQUERY = Boolean(GCP_PROJECT_ID && ANALYTICS_DATASET);
let bigqueryClient = null;
if (USE_BIGQUERY) {
  try {
    const { BigQuery } = require('@google-cloud/bigquery');
    bigqueryClient = new BigQuery({ projectId: GCP_PROJECT_ID });
  } catch (error) {
    console.error('BigQuery analytics disabled:', error.message);
  }
}
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_EVENTS_PER_REQUEST = 250;
fs.mkdirSync(DATA_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.ico': 'image/x-icon',
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : min));
const safeString = (value, max = 240) => typeof value === 'string' ? value.slice(0, max) : '';
const safeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

async function loadAnalyticsEvents() {
  if (!bigqueryClient) return readEvents();
  try {
    const query = `SELECT * FROM \`${GCP_PROJECT_ID}.${ANALYTICS_DATASET}.${ANALYTICS_TABLE}\` WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 365 DAY) ORDER BY timestamp DESC LIMIT 100000`;
    const [rows] = await bigqueryClient.query({ query, location: process.env.BIGQUERY_LOCATION || 'US' });
    return rows;
  } catch (error) {
    console.error('BigQuery read failed; using local fallback:', error.message);
    return readEvents();
  }
}

async function storeAnalyticsEvents(events) {
  if (!events.length) return;
  fs.appendFileSync(EVENTS_FILE, events.map((event) => JSON.stringify(event)).join('\n') + '\n');
  if (!bigqueryClient) return;
  try {
    const rows = events.map((event) => ({ ...event, region: event.region ? JSON.stringify(event.region) : null }));
    await bigqueryClient.dataset(ANALYTICS_DATASET).table(ANALYTICS_TABLE).insert(rows, { skipInvalidRows: false, ignoreUnknownValues: true });
  } catch (error) {
    console.error('BigQuery insert failed; event retained in local fallback:', error.message);
  }
}

function normalizeRegion(value) {
  if (!value || typeof value !== 'object') return null;
  return { x: clamp(value.x, 0, 100), y: clamp(value.y, 0, 100), width: clamp(value.width, 0, 100), height: clamp(value.height, 0, 100) };
}
function normalizeEvent(input) {
  const timestamp = new Date(input.timestamp || Date.now());
  const event = {
    event_id: safeString(input.event_id, 100) || crypto.randomUUID(), type: safeString(input.type, 50) || 'unknown',
    timestamp: Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString(),
    session_id: safeString(input.session_id, 100), visitor_id: safeString(input.visitor_id, 100), path: safeString(input.path, 240),
    referrer: safeString(input.referrer, 160), viewport: safeString(input.viewport, 32), screen: safeString(input.screen, 32),
    device: safeString(input.device, 24), browser: safeString(input.browser, 24), operating_system: safeString(input.operating_system, 24),
    connection: input.connection && typeof input.connection === 'object' ? { type: safeString(input.connection.type, 16), save_data: Boolean(input.connection.save_data), downlink: clamp(input.connection.downlink, 0, 10000), rtt: clamp(input.connection.rtt, 0, 60000) } : null,
    language: safeString(input.language, 40), timezone: safeString(input.timezone, 80),
    source: safeString(input.source, 80), campaign: safeString(input.campaign, 120), scroll_percent: clamp(input.scroll_percent, 0, 100),
  };
  for (const key of ['target', 'label', 'section', 'title', 'input']) if (input[key] !== undefined) event[key] = safeString(input[key], key === 'label' ? 160 : 120);
  if (input.region) event.region = normalizeRegion(input.region);
  for (const key of ['duration_ms', 'visible_ratio', 'depth_percent', 'session_duration_ms', 'response_ms', 'dom_content_loaded_ms', 'load_ms', 'transfer_size_bytes']) {
    if (input[key] !== undefined) event[key] = Math.max(0, Math.min(31_536_000_000, safeNumber(input[key])));
  }
  return event;
}
function readEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];
  return fs.readFileSync(EVENTS_FILE, 'utf8').split('\n').filter(Boolean).map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
}
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0; const chunks = [];
    req.on('data', (chunk) => { total += chunk.length; if (total > MAX_BODY_BYTES) { reject(new Error('Request body too large')); req.destroy(); return; } chunks.push(chunk); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function addCount(map, key, amount = 1) { if (key) map.set(key, (map.get(key) || 0) + amount); }
function topMap(map) { return [...map.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 30); }
function getTarget(targets, event) {
  if (!event.target) return null;
  const row = targets.get(event.target) || { target: event.target, label: event.label || '', views: 0, hovers: 0, focuses: 0, clicks: 0, dwell_ms: 0, region: null };
  row.label = row.label || event.label || '';
  row.region = event.region || row.region;
  targets.set(event.target, row);
  return row;
}
function aggregate(events, days) {
  const since = Date.now() - days * 86400000;
  const recent = events.filter((event) => new Date(event.timestamp).getTime() >= since);
  const sessions = new Set(recent.map((event) => event.session_id).filter(Boolean));
  const visitors = new Set(recent.map((event) => event.visitor_id).filter(Boolean));
  const types = new Map(), sections = new Map(), targets = new Map(), paths = new Map(), referrers = new Map(), devices = new Map(), viewports = new Map(), languages = new Map(), timezones = new Map(), sources = new Map(), campaigns = new Map(), scrolls = new Map(), sessionRows = new Map();
  const scrollHeat = Array.from({ length: 20 }, (_, index) => ({ bucket: index, percent: index * 5, score: 0 }));
  const scrollWeight = { page_view: 1, section_view: 3, section_milestone: 2, section_exit: 1, section_attention: 4, target_view: 2, hover_start: 2, hover_end: 1, focus_start: 2, focus_end: 1, click: 5, scroll_depth: 2, navigation_timing: 1, page_exit: 1 };
  for (const event of recent) {
    addCount(types, event.type); addCount(paths, event.path); addCount(referrers, event.referrer); addCount(devices, event.device); addCount(viewports, event.viewport); addCount(languages, event.language); addCount(timezones, event.timezone); addCount(sources, event.source); addCount(campaigns, event.campaign);
    if (event.scroll_percent !== undefined) {
      const bucket = Math.max(0, Math.min(19, Math.floor(Number(event.scroll_percent) / 5)));
      const dwellWeight = event.type === 'section_exit' || event.type === 'hover_end' || event.type === 'focus_end' ? Math.min(8, Math.max(1, Number(event.duration_ms || 0) / 5000)) : 0;
      scrollHeat[bucket].score += (scrollWeight[event.type] || 1) + dwellWeight;
    }
    if (event.session_id) {
      const row = sessionRows.get(event.session_id) || { session_id: event.session_id, first: event.timestamp, last: event.timestamp, events: 0, max_scroll: 0 };
      row.first = row.first < event.timestamp ? row.first : event.timestamp; row.last = row.last > event.timestamp ? row.last : event.timestamp; row.events += 1; row.max_scroll = Math.max(row.max_scroll, safeNumber(event.depth_percent)); sessionRows.set(event.session_id, row);
      if (event.type === 'scroll_depth') scrolls.set(event.session_id, Math.max(scrolls.get(event.session_id) || 0, safeNumber(event.depth_percent)));
    }
    if (event.type === 'section_view' || event.type === 'section_milestone' || event.type === 'section_exit' || event.type === 'section_attention') {
      if (event.section) {
        const row = sections.get(event.section) || { section: event.section, views: 0, milestones: 0, dwell_ms: 0, region: null };
        if (event.type === 'section_view') row.views += 1;
        if (event.type === 'section_milestone') row.milestones += 1;
        if (event.type === 'section_exit' || event.type === 'section_attention') row.dwell_ms += safeNumber(event.duration_ms);
        row.region = event.region || row.region; sections.set(event.section, row);
      }
    }
    const target = getTarget(targets, event);
    if (target) {
      if (event.type === 'target_view') target.views += 1;
      if (event.type === 'hover_start') target.hovers += 1;
      if (event.type === 'focus_start') target.focuses += 1;
      if (event.type === 'click') target.clicks += 1;
      if (event.type === 'hover_end' || event.type === 'focus_end') target.dwell_ms += safeNumber(event.duration_ms);
    }
  }
  const sessionsList = [...sessionRows.values()].sort((a, b) => b.last.localeCompare(a.last)).slice(0, 50);
  const sectionList = [...sections.values()].map((row) => ({ ...row, avg_dwell_ms: row.views ? Math.round(row.dwell_ms / row.views) : 0, heat_score: Math.round(row.dwell_ms / 1000 + row.views * 3 + row.milestones * 2) })).sort((a, b) => b.dwell_ms - a.dwell_ms);
  const scrollMax = Math.max(...scrollHeat.map((row) => row.score), 1);
  const scrollList = scrollHeat.map((row) => ({ ...row, heat: Math.round((row.score / scrollMax) * 100) }));
  const hotZones = [...targets.values()].map((row) => ({ ...row, score: Math.round(row.views + row.hovers * 2 + row.focuses * 3 + row.clicks * 5 + Math.min(row.dwell_ms / 1000, 120)) })).filter((row) => row.region).sort((a, b) => b.score - a.score).slice(0, 100);
  const avgSession = sessionsList.length ? Math.round(sessionsList.reduce((sum, row) => sum + (new Date(row.last) - new Date(row.first)), 0) / sessionsList.length) : 0;
  const avgScroll = scrolls.size ? Math.round([...scrolls.values()].reduce((sum, value) => sum + value, 0) / scrolls.size) : 0;
  const trendMap = new Map();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
    trendMap.set(date, { date, events: 0, sessions: new Set(), visitors: new Set(), engaged: new Set(), scroll_total: 0, scroll_count: 0 });
  }
  for (const event of recent) {
    const bucket = trendMap.get(new Date(event.timestamp).toISOString().slice(0, 10));
    if (!bucket) continue;
    bucket.events += 1;
    if (event.session_id) bucket.sessions.add(event.session_id);
    if (event.visitor_id) bucket.visitors.add(event.visitor_id);
    if (event.session_id && ['click', 'hover_start', 'focus_start', 'scroll_depth'].includes(event.type)) bucket.engaged.add(event.session_id);
    if (event.type === 'scroll_depth') { bucket.scroll_total += safeNumber(event.depth_percent); bucket.scroll_count += 1; }
  }
  const trend = [...trendMap.values()].map((bucket) => ({ date: bucket.date, events: bucket.events, sessions: bucket.sessions.size, visitors: bucket.visitors.size, engaged: bucket.engaged.size, average_scroll_percent: bucket.scroll_count ? Math.round(bucket.scroll_total / bucket.scroll_count) : 0 }));
  return {
    generated_at: new Date().toISOString(), days, trend,
    totals: { events: recent.length, sessions: sessions.size, visitors: visitors.size, engaged_sessions: new Set(recent.filter((e) => ['click', 'hover_start', 'focus_start', 'scroll_depth'].includes(e.type)).map((e) => e.session_id)).size, average_session_ms: avgSession, average_scroll_percent: avgScroll },
    event_types: topMap(types).map((row) => ({ type: row.value, count: row.count })),
    sections: sectionList, targets: [...targets.values()].sort((a, b) => (b.dwell_ms + b.hovers * 1000 + b.clicks * 2000) - (a.dwell_ms + a.hovers * 1000 + a.clicks * 2000)).slice(0, 100), hot_zones: hotZones, scroll_heat: scrollList,
    navigation: { paths: topMap(paths), referrers: topMap(referrers), devices: topMap(devices), viewports: topMap(viewports), languages: topMap(languages), timezones: topMap(timezones), sources: topMap(sources), campaigns: topMap(campaigns) },
    sessions: sessionsList,
  };
}
function sessionDetail(events, sessionId) {
  const sessionEvents = events.filter((event) => event.session_id === sessionId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (!sessionEvents.length) return null;
  const first = sessionEvents[0]; const last = sessionEvents[sessionEvents.length - 1];
  const connection = sessionEvents.find((event) => event.connection || event.browser || event.operating_system) || first;
  const sections = new Map();
  for (const event of sessionEvents) {
    if (!event.section) continue;
    const row = sections.get(event.section) || { section: event.section, views: 0, dwell_ms: 0, milestones: 0 };
    if (event.type === 'section_view') row.views += 1;
    if (event.type === 'section_milestone') row.milestones += 1;
    if (event.type === 'section_attention' || event.type === 'section_exit') row.dwell_ms += safeNumber(event.duration_ms);
    sections.set(event.section, row);
  }
  return { session_id: sessionId, first: first.timestamp, last: last.timestamp, duration_ms: Math.max(0, new Date(last.timestamp) - new Date(first.timestamp)), events: sessionEvents, sections: [...sections.values()], context: { device: connection.device || '', browser: connection.browser || '', operating_system: connection.operating_system || '', connection: connection.connection || null, viewport: connection.viewport || '', language: connection.language || '', timezone: connection.timezone || '', referrer: connection.referrer || '' } };
}
function sendJson(res, status, payload) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(payload)); }
function sendText(res, status, body) { res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(body); }
function serveStatic(res, pathname) {
  let filePath = pathname === '/' ? path.join(ROOT, 'index.html') : path.join(ROOT, pathname.replace(/^\/+/, ''));
  if (pathname === '/analytics' || pathname === '/analytics/') filePath = path.join(ROOT, 'analytics-dashboard.html');
  filePath = path.normalize(filePath); if (!filePath.startsWith(ROOT + path.sep)) return sendText(res, 403, 'Forbidden');
  fs.stat(filePath, (error, stats) => { if (error || !stats.isFile()) return sendText(res, 404, 'Not found'); const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'; res.writeHead(200, { 'Content-Type': type, 'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=3600' : 'no-cache' }); fs.createReadStream(filePath).pipe(res); });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end(); }
  if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { ok: true, service: 'portfolio-analytics', time: new Date().toISOString() });
  if (req.method === 'GET' && url.pathname === '/api/analytics') return sendJson(res, 200, aggregate(await loadAnalyticsEvents(), Math.max(1, Math.min(365, Number(url.searchParams.get('days') || 30)))));
  if (req.method === 'GET' && url.pathname === '/api/events') return sendJson(res, 200, { events: (await loadAnalyticsEvents()).slice(-Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 100)))).reverse() });
  if (req.method === 'GET' && url.pathname.startsWith('/api/sessions/')) { const sessionId = decodeURIComponent(url.pathname.slice('/api/sessions/'.length)); const detail = sessionDetail(await loadAnalyticsEvents(), sessionId); return detail ? sendJson(res, 200, detail) : sendJson(res, 404, { error: 'Session not found' }); }
  if (req.method === 'GET' && url.pathname === '/api/events.csv') {
    const events = readEvents();
    const keys = ['event_id', 'type', 'timestamp', 'session_id', 'visitor_id', 'path', 'referrer', 'viewport', 'screen', 'device', 'language', 'timezone', 'source', 'campaign', 'scroll_percent', 'target', 'section', 'duration_ms', 'visible_ratio', 'depth_percent', 'session_duration_ms', 'region'];
    const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [keys.join(','), ...events.map((event) => keys.map((key) => quote(typeof event[key] === 'object' ? JSON.stringify(event[key]) : event[key])).join(','))];
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="portfolio-events.csv"', 'Cache-Control': 'no-store' });
    return res.end(rows.join('\n'));
  }
  if (req.method === 'POST' && url.pathname === '/api/events') { try { const payload = await parseBody(req); const incoming = Array.isArray(payload) ? payload : payload.events; if (!Array.isArray(incoming)) return sendJson(res, 400, { error: 'Expected an events array' }); const events = incoming.slice(0, MAX_EVENTS_PER_REQUEST).map(normalizeEvent); await storeAnalyticsEvents(events); return sendJson(res, 202, { accepted: events.length, durable_store: Boolean(bigqueryClient) }); } catch (error) { return sendJson(res, 400, { error: error.message }); } }
  if (req.method === 'GET') return serveStatic(res, url.pathname);
  return sendText(res, 405, 'Method not allowed');
});
server.listen(PORT, HOST, () => { console.log(`Portfolio running at http://${HOST}:${PORT}`); console.log(`Analytics console at http://${HOST}:${PORT}/analytics`); console.log(`Events stored in ${EVENTS_FILE}`); console.log(`BigQuery analytics: ${bigqueryClient ? `${GCP_PROJECT_ID}.${ANALYTICS_DATASET}.${ANALYTICS_TABLE}` : 'disabled'}`); });
