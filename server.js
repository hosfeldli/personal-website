'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { URL } = require('node:url');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.ndjson');
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.K_SERVICE ? '0.0.0.0' : (process.env.HOST || '127.0.0.1');
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
const ANALYTICS_DATASET = process.env.ANALYTICS_DATASET || '';
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'events';
const ANALYTICS_USERNAME = process.env.ANALYTICS_USERNAME || 'liam';
const ANALYTICS_PASSWORD = process.env.ANALYTICS_PASSWORD || '';
const USE_BIGQUERY = Boolean(GCP_PROJECT_ID && ANALYTICS_DATASET);
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_EVENTS_PER_REQUEST = 250;
const READ_WINDOW_DAYS = 730;
const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript))/;
const COMPRESS_MIN_BYTES = 1024;
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 40;
const RATE_LIMIT_MAX_EVENTS = 600;
const DEDUPE_CAPACITY = 8000;
const SESSION_IDLE_GAP_MS = 5 * 60 * 1000;
const MAX_REASONABLE_SESSION_MS = 2 * 60 * 60 * 1000;

fs.mkdirSync(DATA_DIR, { recursive: true });

let bigqueryClient = null;
let lastBigQueryWrite = { ok: false, at: null, error: null };
if (USE_BIGQUERY) {
  try {
    const { BigQuery } = require('@google-cloud/bigquery');
    bigqueryClient = new BigQuery({ projectId: GCP_PROJECT_ID });
  } catch (error) {
    console.error('BigQuery analytics disabled:', error.message);
  }
}

/* ---------- ingestion protection ---------- */
const rateBuckets = new Map();

function clientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(req, eventCount) {
  const now = Date.now();
  const key = clientKey(req);
  const bucket = rateBuckets.get(key) || { start: now, requests: 0, events: 0 };
  if (now - bucket.start > RATE_LIMIT_WINDOW_MS) {
    bucket.start = now;
    bucket.requests = 0;
    bucket.events = 0;
  }
  bucket.requests += 1;
  bucket.events += eventCount;
  rateBuckets.set(key, bucket);
  if (rateBuckets.size > 5000) {
    for (const [entryKey, entry] of rateBuckets) {
      if (now - entry.start > RATE_LIMIT_WINDOW_MS) rateBuckets.delete(entryKey);
    }
  }
  if (bucket.requests > RATE_LIMIT_MAX_REQUESTS || bucket.events > RATE_LIMIT_MAX_EVENTS) {
    return Math.ceil((bucket.start + RATE_LIMIT_WINDOW_MS - now) / 1000);
  }
  return 0;
}

const seenEventIds = new Set();
function isDuplicate(eventId) {
  if (!eventId) return false;
  if (seenEventIds.has(eventId)) return true;
  seenEventIds.add(eventId);
  if (seenEventIds.size > DEDUPE_CAPACITY) {
    const excess = seenEventIds.size - DEDUPE_CAPACITY;
    let removed = 0;
    for (const id of seenEventIds) {
      seenEventIds.delete(id);
      if (++removed >= excess) break;
    }
  }
  return false;
}

/* ---------- non-blocking append with backpressure ---------- */
let writeChain = Promise.resolve();
function appendEvents(lines) {
  writeChain = writeChain
    .then(() => fs.promises.appendFile(EVENTS_FILE, lines))
    .catch((error) => console.error('Event append failed:', error.message));
  return writeChain;
}

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
  '/script.js',
  '/analytics.js',
  '/dashboard.css',
  '/dashboard.js',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]);

const SECTION_ALIASES = {
  'analytics-skills': 'skills',
};

const SECTION_LABELS = {
  introduction: 'Introduction',
  resume: 'Experience',
  'current-role-metrics': 'Impact',
  'selected-work': 'Case studies',
  skills: 'Skills',
  'contact-quick': 'Contact CTA',
  'outside-work': 'Outside work',
  contact: 'Contact',
};

const CTA_GROUPS = [
  {
    key: 'resume',
    label: 'Résumé',
    targets: ['hero-resume', 'nav-resume', 'quick-resume'],
  },
  {
    key: 'case_studies',
    label: 'Case studies',
    targets: ['hero-projects', 'nav-projects', 'project-billing-platform', 'project-edi-documentation', 'project-details-billing', 'project-details-edi'],
  },
  {
    key: 'contact',
    label: 'Email',
    targets: ['header-email', 'quick-email', 'contact-email'],
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    targets: ['header-linkedin', 'hero-linkedin', 'contact-linkedin'],
  },
];

const RESUME_TARGETS = new Set(CTA_GROUPS.find((group) => group.key === 'resume').targets);
const CONTACT_TARGETS = new Set([
  ...CTA_GROUPS.find((group) => group.key === 'contact').targets,
  ...CTA_GROUPS.find((group) => group.key === 'linkedin').targets,
]);
const CASE_STUDY_TARGETS = new Set(CTA_GROUPS.find((group) => group.key === 'case_studies').targets);
const HIGH_INTENT_TARGETS = new Set([
  ...RESUME_TARGETS,
  ...CONTACT_TARGETS,
  'project-details-billing',
  'project-details-edi',
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : min));
const safeString = (value, max = 240) => typeof value === 'string' ? value.slice(0, max) : '';
const safeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const canonicalSection = (value) => SECTION_ALIASES[value] || value || '';
const percent = (numerator, denominator) => denominator ? Math.round((numerator / denominator) * 1000) / 10 : 0;

function secureEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function analyticsAuthorized(req) {
  const header = safeString(req.headers.authorization, 1000);
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator < 0) return false;
    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    return secureEqual(username, ANALYTICS_USERNAME) && secureEqual(password, ANALYTICS_PASSWORD);
  } catch {
    return false;
  }
}

function requireAnalyticsAuth(req, res) {
  if (!ANALYTICS_PASSWORD) {
    res.writeHead(503, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end('Analytics access is disabled until ANALYTICS_PASSWORD is configured.');
    return false;
  }
  if (analyticsAuthorized(req)) return true;
  res.writeHead(401, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'WWW-Authenticate': 'Basic realm="Portfolio Analytics", charset="UTF-8"',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end('Authentication required.');
  return false;
}

function isProtectedAnalyticsRead(method, pathname) {
  if (!['GET', 'HEAD'].includes(method)) return false;
  return pathname === '/analytics'
    || pathname === '/analytics/'
    || pathname === '/analytics-dashboard.html'
    || pathname === '/api/analytics'
    || pathname === '/api/events'
    || pathname === '/api/events.csv'
    || pathname.startsWith('/api/sessions/');
}

async function loadAnalyticsEvents() {
  if (!bigqueryClient) return readEvents();
  try {
    const query = `SELECT * FROM \`${GCP_PROJECT_ID}.${ANALYTICS_DATASET}.${ANALYTICS_TABLE}\` WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${READ_WINDOW_DAYS} DAY) ORDER BY timestamp DESC LIMIT 150000`;
    const [rows] = await bigqueryClient.query({
      query,
      location: process.env.BIGQUERY_LOCATION || 'US',
      useLegacySql: false,
    });
    return rows;
  } catch (error) {
    console.error('BigQuery read failed; using local fallback:', error.message);
    return readEvents();
  }
}

async function storeAnalyticsEvents(events) {
  if (!events.length) return;
  await appendEvents(`${events.map((event) => JSON.stringify(event)).join('\n')}\n`);
  if (!bigqueryClient) return;
  try {
    // Keep nested values as objects. BigQuery maps these to RECORD/STRUCT
    // columns; stringifying them makes inserts fail when the table uses the
    // natural nested schema.
    const rows = events.map((event) => ({ ...event }));
    await bigqueryClient.dataset(ANALYTICS_DATASET).table(ANALYTICS_TABLE).insert(rows, {
      skipInvalidRows: false,
      ignoreUnknownValues: true,
    });
    lastBigQueryWrite = { ok: true, at: new Date().toISOString(), error: null };
  } catch (error) {
    lastBigQueryWrite = { ok: false, at: new Date().toISOString(), error: error.message };
    console.error('BigQuery insert failed; event retained in local fallback:', error.message);
  }
}

function normalizeRegion(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    x: clamp(value.x, 0, 100),
    y: clamp(value.y, 0, 100),
    width: clamp(value.width, 0, 100),
    height: clamp(value.height, 0, 100),
  };
}

function normalizeEvent(input) {
  const timestamp = new Date(input.timestamp || Date.now());
  const event = {
    event_id: safeString(input.event_id, 100) || crypto.randomUUID(),
    type: safeString(input.type, 50) || 'unknown',
    timestamp: Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString(),
    session_id: safeString(input.session_id, 100),
    visitor_id: safeString(input.visitor_id, 100),
    path: safeString(input.path, 240),
    referrer: safeString(input.referrer, 160),
    viewport: safeString(input.viewport, 32),
    screen: safeString(input.screen, 32),
    device: safeString(input.device, 24),
    browser: safeString(input.browser, 24),
    operating_system: safeString(input.operating_system, 24),
    connection: input.connection && typeof input.connection === 'object' ? {
      type: safeString(input.connection.type, 16),
      save_data: Boolean(input.connection.save_data),
      downlink: clamp(input.connection.downlink, 0, 10000),
      rtt: clamp(input.connection.rtt, 0, 60000),
    } : null,
    language: safeString(input.language, 40),
    timezone: safeString(input.timezone, 80),
    source: safeString(input.source, 80),
    campaign: safeString(input.campaign, 120),
    scroll_percent: clamp(input.scroll_percent, 0, 100),
  };
  event.schema_version = Math.max(1, safeNumber(input.schema_version) || 1);
  event.is_bot = Boolean(input.is_bot);
  event.medium = safeString(input.medium, 80);
  for (const key of ['target', 'label', 'section', 'title', 'input', 'click_kind', 'copy_kind', 'href', 'message', 'error_source']) {
    if (input[key] !== undefined) event[key] = safeString(input[key], key === 'label' || key === 'href' ? 200 : 120);
  }
  if (input.region) event.region = normalizeRegion(input.region);
  for (const key of [
    'duration_ms', 'visible_ratio', 'depth_percent', 'session_duration_ms', 'response_ms',
    'dom_content_loaded_ms', 'load_ms', 'transfer_size_bytes', 'active_ms', 'visit_count',
    'engaged_ratio', 'max_scroll_percent', 'delivery_failures', 'click_count', 'text_length',
    'error_line', 'resource_count', 'resource_bytes', 'lcp_ms', 'fcp_ms', 'ttfb_ms', 'inp_ms',
  ]) {
    if (input[key] !== undefined && input[key] !== null) {
      event[key] = Math.max(0, Math.min(31_536_000_000, safeNumber(input[key])));
    }
  }
  if (input.cls !== undefined && input.cls !== null) event.cls = clamp(input.cls, 0, 100);
  return event;
}

function readEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];
  return fs.readFileSync(EVENTS_FILE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function addCount(map, key, amount = 1) {
  if (key) map.set(key, (map.get(key) || 0) + amount);
}

function topMap(map, limit = 30) {
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function eventsInRange(events, start, end) {
  return events.filter((event) => {
    const time = new Date(event.timestamp).getTime();
    return Number.isFinite(time) && time >= start && time < end;
  });
}

function buildSessionRows(events) {
  const rows = new Map();
  for (const event of events) {
    if (!event.session_id) continue;
    const row = rows.get(event.session_id) || {
      session_id: event.session_id,
      visitor_id: event.visitor_id || '',
      first: event.timestamp,
      last: event.timestamp,
      events: 0,
      max_scroll: 0,
      reported_duration_ms: 0,
      active_ms: 0,
      visit_count: 0,
      stamps: [],
      sections: new Set(),
      target_views: new Set(),
      clicks: new Set(),
      signals: new Set(),
      referrer: event.referrer || '',
      source: event.source || '',
      campaign: event.campaign || '',
      device: event.device || '',
      browser: event.browser || '',
      operating_system: event.operating_system || '',
      viewport: event.viewport || '',
    };
    row.events += 1;
    const stampMs = new Date(event.timestamp).getTime();
    if (Number.isFinite(stampMs)) row.stamps.push(stampMs);
    if (event.timestamp < row.first) row.first = event.timestamp;
    if (event.timestamp > row.last) row.last = event.timestamp;
    row.max_scroll = Math.max(row.max_scroll, safeNumber(event.depth_percent), safeNumber(event.scroll_percent));
    row.reported_duration_ms = Math.max(row.reported_duration_ms, safeNumber(event.session_duration_ms));
    row.active_ms = Math.max(row.active_ms, safeNumber(event.active_ms));
    row.visit_count = Math.max(row.visit_count, safeNumber(event.visit_count));
    if (event.section) row.sections.add(canonicalSection(event.section));
    if (event.type === 'target_view' && event.target) row.target_views.add(event.target);
    if (event.type === 'click' && event.target) row.clicks.add(event.target);
    if (['resume_download', 'outbound_click', 'print', 'copy', 'rage_click', 'dead_click', 'js_error'].includes(event.type)) {
      row.signals.add(event.type === 'copy' && event.copy_kind === 'email' ? 'copy_email' : event.type);
    }
    row.referrer ||= event.referrer || '';
    row.source ||= event.source || '';
    row.campaign ||= event.campaign || '';
    row.device ||= event.device || '';
    row.browser ||= event.browser || '';
    row.operating_system ||= event.operating_system || '';
    row.viewport ||= event.viewport || '';
    rows.set(event.session_id, row);
  }

  return [...rows.values()].map((row) => {
    const observedDuration = Math.max(0, new Date(row.last) - new Date(row.first));
    /* A tab left open for hours is not a long session. Sum only the gaps that
       represent continuous presence, so idle time never inflates the number. */
    const stamps = row.stamps.sort((a, b) => a - b);
    let engagedSpan = 0;
    for (let index = 1; index < stamps.length; index += 1) {
      const gap = stamps[index] - stamps[index - 1];
      if (gap <= SESSION_IDLE_GAP_MS) engagedSpan += gap;
    }
    const reported = Math.min(row.reported_duration_ms, MAX_REASONABLE_SESSION_MS);
    const durationMs = Math.min(
      MAX_REASONABLE_SESSION_MS,
      Math.max(engagedSpan, reported, Math.min(observedDuration, SESSION_IDLE_GAP_MS)),
    );
    const resumeAction = [...row.clicks].some((target) => RESUME_TARGETS.has(target)) || row.signals.has('resume_download');
    const contactAction = [...row.clicks].some((target) => CONTACT_TARGETS.has(target)) || row.signals.has('copy_email');
    const caseStudyAction = row.sections.has('selected-work') || [...row.clicks].some((target) => CASE_STUDY_TARGETS.has(target));
    const impactReached = row.sections.has('current-role-metrics');
    const highIntent = [...row.clicks].some((target) => HIGH_INTENT_TARGETS.has(target))
      || row.signals.has('resume_download')
      || row.signals.has('copy_email')
      || row.signals.has('print')
      || row.signals.has('outbound_click');
    const activeMs = row.active_ms;
    const engaged = activeMs >= 20000 || durationMs >= 30000 || row.max_scroll >= 50 || row.clicks.size > 0 || row.sections.size >= 3;
    const quickExit = durationMs < 10000 && row.max_scroll < 25 && row.clicks.size === 0;
    const frustrated = row.signals.has('rage_click') || row.signals.has('dead_click') || row.signals.has('js_error');
    const outcomes = [];
    if (resumeAction) outcomes.push('Résumé');
    if (contactAction) outcomes.push('Contact');
    if (caseStudyAction) outcomes.push('Case studies');
    if (row.signals.has('print')) outcomes.push('Printed');
    if (row.signals.has('outbound_click')) outcomes.push('LinkedIn');
    return {
      ...row,
      stamps: undefined,
      sections: [...row.sections],
      target_views: [...row.target_views],
      clicks: [...row.clicks],
      signals: [...row.signals],
      duration_ms: durationMs,
      frustrated,
      resume_action: resumeAction,
      contact_action: contactAction,
      case_study_action: caseStudyAction,
      impact_reached: impactReached,
      high_intent: highIntent,
      engaged,
      quick_exit: quickExit,
      outcomes,
    };
  });
}

function buildSectionPerformance(events, sessions) {
  const perSession = new Map();
  for (const event of events) {
    if (!event.session_id || !event.section) continue;
    const section = canonicalSection(event.section);
    if (!SECTION_LABELS[section]) continue;
    const key = `${event.session_id}\u0000${section}`;
    const row = perSession.get(key) || {
      session_id: event.session_id,
      section,
      views: 0,
      milestones: 0,
      attention_ms: 0,
      exit_ms: 0,
      region: null,
    };
    if (event.type === 'section_view') row.views += 1;
    if (event.type === 'section_milestone') row.milestones += 1;
    if (event.type === 'section_attention') row.attention_ms += safeNumber(event.duration_ms);
    if (event.type === 'section_exit') row.exit_ms = Math.max(row.exit_ms, safeNumber(event.duration_ms));
    row.region = event.region || row.region;
    perSession.set(key, row);
  }

  const sections = new Map();
  for (const row of perSession.values()) {
    const aggregate = sections.get(row.section) || {
      section: row.section,
      label: SECTION_LABELS[row.section],
      views: 0,
      sessions: 0,
      milestones: 0,
      total_dwell_ms: 0,
      region: null,
    };
    aggregate.views += row.views;
    aggregate.sessions += 1;
    aggregate.milestones += row.milestones;
    aggregate.total_dwell_ms += Math.max(row.attention_ms, row.exit_ms);
    aggregate.region = row.region || aggregate.region;
    sections.set(row.section, aggregate);
  }

  return [...sections.values()]
    .map((row) => ({
      ...row,
      reach_rate: percent(row.sessions, sessions.length),
      avg_dwell_ms: row.sessions ? Math.round(row.total_dwell_ms / row.sessions) : 0,
    }))
    .sort((a, b) => b.reach_rate - a.reach_rate);
}

function buildCtaPerformance(events) {
  return CTA_GROUPS.map((group) => {
    const targets = new Set(group.targets);
    const viewedSessions = new Set();
    const clickedSessions = new Set();
    let clicks = 0;
    let dwellMs = 0;
    for (const event of events) {
      if (!targets.has(event.target)) continue;
      if (event.type === 'target_view' && event.session_id) viewedSessions.add(event.session_id);
      if (event.type === 'click') {
        clicks += 1;
        if (event.session_id) clickedSessions.add(event.session_id);
      }
      if (event.type === 'hover_end' || event.type === 'focus_end') dwellMs += safeNumber(event.duration_ms);
    }
    return {
      key: group.key,
      label: group.label,
      viewed_sessions: viewedSessions.size,
      clicked_sessions: clickedSessions.size,
      clicks,
      click_rate: percent(clickedSessions.size, viewedSessions.size),
      avg_dwell_ms: viewedSessions.size ? Math.round(dwellMs / viewedSessions.size) : 0,
    };
  });
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(fraction * sorted.length) - 1));
  return Math.round(sorted[index] * 1000) / 1000;
}

const VITAL_THRESHOLDS = {
  lcp_ms: [2500, 4000],
  inp_ms: [200, 500],
  cls: [0.1, 0.25],
  fcp_ms: [1800, 3000],
  ttfb_ms: [800, 1800],
};

function buildWebVitals(events) {
  const vitalEvents = events.filter((event) => event.type === 'web_vitals');
  const rows = Object.keys(VITAL_THRESHOLDS).map((key) => {
    const values = vitalEvents
      .map((event) => event[key])
      .filter((value) => typeof value === 'number' && Number.isFinite(value));
    const p75 = percentile(values, 0.75);
    const [good, poor] = VITAL_THRESHOLDS[key];
    return {
      metric: key,
      label: { lcp_ms: 'LCP', inp_ms: 'INP', cls: 'CLS', fcp_ms: 'FCP', ttfb_ms: 'TTFB' }[key],
      unit: key === 'cls' ? '' : 'ms',
      samples: values.length,
      p75,
      p50: percentile(values, 0.5),
      rating: !values.length ? 'unknown' : p75 <= good ? 'good' : p75 <= poor ? 'needs-improvement' : 'poor',
      good_threshold: good,
      poor_threshold: poor,
    };
  });
  return { samples: vitalEvents.length, metrics: rows };
}

function buildFriction(events, sessions) {
  const rage = events.filter((event) => event.type === 'rage_click');
  const dead = events.filter((event) => event.type === 'dead_click');
  const errors = events.filter((event) => event.type === 'js_error');
  const rageTargets = new Map();
  for (const event of rage) addCount(rageTargets, event.target || 'unlabeled', 1);
  const deadZones = new Map();
  for (const event of dead) {
    if (!event.region) continue;
    addCount(deadZones, `${Math.round(event.region.y / 5) * 5}% down the page`, 1);
  }
  const errorMessages = new Map();
  for (const event of errors) addCount(errorMessages, event.message || 'unknown', 1);
  const failedDelivery = events.filter((event) => safeNumber(event.delivery_failures) > 0).length;
  return {
    rage_clicks: rage.length,
    rage_sessions: new Set(rage.map((event) => event.session_id).filter(Boolean)).size,
    dead_clicks: dead.length,
    dead_sessions: new Set(dead.map((event) => event.session_id).filter(Boolean)).size,
    js_errors: errors.length,
    error_sessions: new Set(errors.map((event) => event.session_id).filter(Boolean)).size,
    error_rate: percent(new Set(errors.map((event) => event.session_id).filter(Boolean)).size, sessions.length),
    delivery_failure_events: failedDelivery,
    top_rage_targets: topMap(rageTargets, 6),
    top_dead_zones: topMap(deadZones, 6),
    top_errors: topMap(errorMessages, 6),
  };
}

function buildIntentSignals(events) {
  const bySession = (type) => new Set(events.filter((event) => event.type === type).map((event) => event.session_id).filter(Boolean)).size;
  const emailCopies = events.filter((event) => event.type === 'copy' && event.copy_kind === 'email');
  return {
    resume_downloads: events.filter((event) => event.type === 'resume_download').length,
    resume_download_sessions: bySession('resume_download'),
    outbound_clicks: events.filter((event) => event.type === 'outbound_click').length,
    outbound_sessions: bySession('outbound_click'),
    email_copies: emailCopies.length,
    email_copy_sessions: new Set(emailCopies.map((event) => event.session_id).filter(Boolean)).size,
    prints: events.filter((event) => event.type === 'print').length,
    print_sessions: bySession('print'),
    text_selections: events.filter((event) => event.type === 'text_selection').length,
  };
}

function metricsFor(events) {
  const sessions = buildSessionRows(events);
  const visitors = new Set(sessions.map((row) => row.visitor_id).filter(Boolean));
  const durations = sessions.map((row) => row.duration_ms).sort((a, b) => a - b);
  const averageSession = sessions.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / sessions.length) : 0;
  const medianSession = durations.length ? durations[Math.floor(durations.length / 2)] : 0;
  const averageScroll = sessions.length ? Math.round(sessions.reduce((sum, row) => sum + row.max_scroll, 0) / sessions.length) : 0;
  const count = (key) => sessions.filter((row) => row[key]).length;
  const activeSessions = sessions.filter((row) => row.active_ms > 0);
  const activeValues = activeSessions.map((row) => row.active_ms);
  const averageActive = activeValues.length ? Math.round(activeValues.reduce((sum, value) => sum + value, 0) / activeValues.length) : 0;
  const averageDurationForActive = activeSessions.length
    ? Math.round(activeSessions.reduce((sum, row) => sum + row.duration_ms, 0) / activeSessions.length)
    : 0;
  const returningSessions = sessions.filter((row) => row.visit_count > 1).length;
  return {
    events: events.length,
    page_views: events.filter((event) => event.type === 'page_view').length,
    sessions: sessions.length,
    visitors: visitors.size,
    engaged_sessions: count('engaged'),
    engagement_rate: percent(count('engaged'), sessions.length),
    high_intent_sessions: count('high_intent'),
    high_intent_rate: percent(count('high_intent'), sessions.length),
    resume_sessions: count('resume_action'),
    contact_sessions: count('contact_action'),
    case_study_sessions: count('case_study_action'),
    impact_sessions: count('impact_reached'),
    quick_exit_sessions: count('quick_exit'),
    quick_exit_rate: percent(count('quick_exit'), sessions.length),
    frustrated_sessions: count('frustrated'),
    frustrated_rate: percent(count('frustrated'), sessions.length),
    average_session_ms: averageSession,
    median_session_ms: medianSession,
    average_scroll_percent: averageScroll,
    average_active_ms: averageActive,
    median_active_ms: percentile(activeValues, 0.5),
    active_ratio: percent(averageActive, averageDurationForActive || 1),
    active_samples: activeValues.length,
    returning_sessions: returningSessions,
    returning_rate: percent(returningSessions, sessions.length),
    sessions_list: sessions,
  };
}

function comparisonRow(current, previous, key) {
  const currentValue = safeNumber(current[key]);
  const previousValue = safeNumber(previous[key]);
  return {
    current: currentValue,
    previous: previousValue,
    delta: previousValue ? Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10 : null,
  };
}

function buildTrend(events, sessions, days, endTime) {
  const buckets = new Map();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(endTime - offset * 86400000).toISOString().slice(0, 10);
    buckets.set(date, {
      date,
      events: 0,
      sessions: 0,
      visitors: new Set(),
      engaged: 0,
      high_intent: 0,
      resume_actions: 0,
      contact_actions: 0,
      scroll_total: 0,
      active_total: 0,
    });
  }
  for (const event of events) {
    const bucket = buckets.get(new Date(event.timestamp).toISOString().slice(0, 10));
    if (bucket) bucket.events += 1;
  }
  for (const session of sessions) {
    const bucket = buckets.get(new Date(session.first).toISOString().slice(0, 10));
    if (!bucket) continue;
    bucket.sessions += 1;
    if (session.visitor_id) bucket.visitors.add(session.visitor_id);
    if (session.engaged) bucket.engaged += 1;
    if (session.high_intent) bucket.high_intent += 1;
    if (session.resume_action) bucket.resume_actions += 1;
    if (session.contact_action) bucket.contact_actions += 1;
    bucket.scroll_total += session.max_scroll;
    bucket.active_total += session.active_ms;
  }
  return [...buckets.values()].map((bucket) => ({
    date: bucket.date,
    events: bucket.events,
    sessions: bucket.sessions,
    visitors: bucket.visitors.size,
    engaged: bucket.engaged,
    high_intent: bucket.high_intent,
    resume_actions: bucket.resume_actions,
    contact_actions: bucket.contact_actions,
    average_scroll_percent: bucket.sessions ? Math.round(bucket.scroll_total / bucket.sessions) : 0,
    active_seconds: bucket.sessions ? Math.round(bucket.active_total / bucket.sessions / 1000) : 0,
  }));
}

function buildRecommendations(totals, sections, ctas, webVitals = null, friction = null) {
  const recommendations = [];

  if (webVitals) {
    const poor = webVitals.metrics.filter((metric) => metric.rating === 'poor' && metric.samples >= 5);
    if (poor.length) {
      recommendations.push({
        tone: 'attention',
        title: `Fix ${poor.map((metric) => metric.label).join(' and ')} before more traffic arrives`,
        body: poor.map((metric) => `${metric.label} p75 is ${metric.p75}${metric.unit} against a ${metric.good_threshold}${metric.unit} target`).join('. ') + '. Slow pages lose recruiters before the proof loads.',
      });
    }
  }

  if (friction && friction.rage_sessions >= 2) {
    recommendations.push({
      tone: 'attention',
      title: 'Visitors are clicking things that do not respond',
      body: `${friction.rage_sessions} sessions produced rage clicks${friction.top_rage_targets[0] ? ` (most often on ${friction.top_rage_targets[0].value})` : ''}. Either make that element interactive or remove the affordance.`,
    });
  }

  if (friction && friction.js_errors > 0) {
    recommendations.push({
      tone: 'attention',
      title: 'JavaScript errors are firing in production',
      body: `${friction.js_errors} errors across ${friction.error_sessions} sessions. Top message: ${friction.top_errors[0]?.value || 'unknown'}.`,
    });
  }

  const caseSection = sections.find((section) => section.section === 'selected-work');
  const resumeCta = ctas.find((cta) => cta.key === 'resume');
  const contactCta = ctas.find((cta) => cta.key === 'contact');

  if (totals.sessions < 20) {
    recommendations.push({
      tone: 'neutral',
      title: 'Treat this as directional',
      body: `The current window contains ${totals.sessions} sessions. Wait for at least 20–30 sessions before making large design decisions.`,
    });
  }
  if (caseSection && caseSection.reach_rate < 55) {
    recommendations.push({
      tone: 'attention',
      title: 'More visitors should reach the case studies',
      body: `Only ${caseSection.reach_rate}% of sessions reached Problem → Results. Consider moving one case-study proof point closer to the hero.`,
    });
  }
  if (resumeCta && resumeCta.viewed_sessions >= 5 && resumeCta.click_rate < 10) {
    recommendations.push({
      tone: 'attention',
      title: 'Strengthen résumé intent',
      body: `Résumé CTAs converted ${resumeCta.click_rate}% of viewed sessions. Test a clearer benefit-led label or place one directly after the impact section.`,
    });
  }
  if (contactCta && contactCta.viewed_sessions >= 5 && contactCta.click_rate < 5) {
    recommendations.push({
      tone: 'attention',
      title: 'Make the contact step easier',
      body: `Email CTAs converted ${contactCta.click_rate}% of viewed sessions. Pair contact with role fit and availability rather than a generic invitation.`,
    });
  }
  if (totals.quick_exit_rate > 35) {
    recommendations.push({
      tone: 'attention',
      title: 'Reduce first-screen ambiguity',
      body: `${totals.quick_exit_rate}% of sessions exited quickly. Keep the role targets and strongest quantified proof visible without scrolling.`,
    });
  }
  if (totals.high_intent_rate >= 15) {
    recommendations.push({
      tone: 'positive',
      title: 'Hiring-intent signals are healthy',
      body: `${totals.high_intent_rate}% of sessions downloaded the résumé, opened a detailed case study, or used a contact channel. Protect this CTA hierarchy.`,
    });
  }
  if (totals.sessions >= 10 && totals.active_ratio > 0 && totals.active_ratio < 40) {
    recommendations.push({
      tone: 'attention',
      title: 'Wall-clock time is overstating engagement',
      body: `Visitors are actively reading only ${totals.active_ratio}% of their session time. Treat median active time (${Math.round(totals.median_active_ms / 1000)}s) as the real number.`,
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      tone: 'neutral',
      title: 'Keep collecting a clean baseline',
      body: 'The current signals are balanced. Focus on qualified traffic and compare the next period before changing the page structure.',
    });
  }
  return recommendations.slice(0, 6);
}

function aggregate(events, days, options = {}) {
  const includeBots = Boolean(options.includeBots);
  const now = Date.now();
  const start = now - days * 86400000;
  const previousStart = start - days * 86400000;
  const allCurrent = eventsInRange(events, start, now + 1);
  const botEvents = allCurrent.filter((event) => event.is_bot);
  const currentEvents = includeBots ? allCurrent : allCurrent.filter((event) => !event.is_bot);
  const previousEvents = eventsInRange(events, previousStart, start).filter((event) => includeBots || !event.is_bot);
  const totals = metricsFor(currentEvents);
  const previousTotals = metricsFor(previousEvents);
  const sessions = totals.sessions_list;
  delete totals.sessions_list;
  delete previousTotals.sessions_list;

  const sections = buildSectionPerformance(currentEvents, sessions);
  const ctaPerformance = buildCtaPerformance(currentEvents);
  const types = new Map();
  const referrers = new Map();
  const devices = new Map();
  const sources = new Map();
  const campaigns = new Map();
  const browsers = new Map();
  for (const event of currentEvents) {
    addCount(types, event.type);
    addCount(referrers, event.referrer || 'Direct');
    addCount(devices, event.device || 'Unknown');
    addCount(sources, event.source || 'Direct');
    addCount(campaigns, event.campaign);
    addCount(browsers, event.browser || 'Unknown');
  }

  const targets = new Map();
  for (const event of currentEvents) {
    if (!event.target) continue;
    const row = targets.get(event.target) || {
      target: event.target,
      label: event.label || '',
      views: 0,
      clicks: 0,
      hovers: 0,
      focuses: 0,
      dwell_ms: 0,
    };
    row.label ||= event.label || '';
    if (event.type === 'target_view') row.views += 1;
    if (event.type === 'click') row.clicks += 1;
    if (event.type === 'hover_start') row.hovers += 1;
    if (event.type === 'focus_start') row.focuses += 1;
    if (event.type === 'hover_end' || event.type === 'focus_end') row.dwell_ms += safeNumber(event.duration_ms);
    targets.set(event.target, row);
  }

  const orderedSessions = sessions
    .sort((a, b) => b.last.localeCompare(a.last))
    .map((session) => ({
      session_id: session.session_id,
      first: session.first,
      last: session.last,
      events: session.events,
      duration_ms: session.duration_ms,
      max_scroll: session.max_scroll,
      engaged: session.engaged,
      high_intent: session.high_intent,
      resume_action: session.resume_action,
      contact_action: session.contact_action,
      case_study_action: session.case_study_action,
      outcomes: session.outcomes,
      device: session.device,
      browser: session.browser,
      source: session.source || session.referrer || 'Direct',
    }));

  const comparison = {};
  for (const key of ['sessions', 'visitors', 'engagement_rate', 'high_intent_rate', 'average_session_ms', 'average_scroll_percent', 'average_active_ms', 'frustrated_rate', 'returning_rate']) {
    comparison[key] = comparisonRow(totals, previousTotals, key);
  }

  const webVitals = buildWebVitals(currentEvents);
  const friction = buildFriction(currentEvents, sessions);
  const intent = buildIntentSignals(currentEvents);

  return {
    generated_at: new Date().toISOString(),
    days,
    totals,
    comparison,
    funnel: [
      { key: 'sessions', label: 'Sessions', value: totals.sessions, rate: 100 },
      { key: 'engaged', label: 'Engaged', value: totals.engaged_sessions, rate: totals.engagement_rate },
      { key: 'impact', label: 'Reached impact', value: totals.impact_sessions, rate: percent(totals.impact_sessions, totals.sessions) },
      { key: 'case_studies', label: 'Reached case studies', value: totals.case_study_sessions, rate: percent(totals.case_study_sessions, totals.sessions) },
      { key: 'high_intent', label: 'High intent', value: totals.high_intent_sessions, rate: totals.high_intent_rate },
    ],
    sections,
    cta_performance: ctaPerformance,
    web_vitals: webVitals,
    friction,
    intent,
    data_quality: {
      bot_events_excluded: includeBots ? 0 : botEvents.length,
      bot_sessions_excluded: includeBots ? 0 : new Set(botEvents.map((event) => event.session_id).filter(Boolean)).size,
      schema_v2_events: currentEvents.filter((event) => safeNumber(event.schema_version) >= 2).length,
      total_events_in_window: allCurrent.length,
    },
    recommendations: buildRecommendations(totals, sections, ctaPerformance, webVitals, friction),
    trend: buildTrend(currentEvents, sessions, days, now),
    acquisition: {
      referrers: topMap(referrers, 8),
      sources: topMap(sources, 8),
      campaigns: topMap(campaigns, 8),
      devices: topMap(devices, 8),
      browsers: topMap(browsers, 8),
    },
    targets: [...targets.values()].sort((a, b) => (b.clicks * 6 + b.views + b.dwell_ms / 1000) - (a.clicks * 6 + a.views + a.dwell_ms / 1000)).slice(0, 40),
    event_types: topMap(types).map((row) => ({ type: row.value, count: row.count })),
    high_intent_sessions: orderedSessions.filter((session) => session.high_intent).slice(0, 30),
    sessions: orderedSessions.slice(0, 75),
  };
}

function sessionDetail(events, sessionId) {
  const sessionEvents = events
    .filter((event) => event.session_id === sessionId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (!sessionEvents.length) return null;
  const session = buildSessionRows(sessionEvents)[0];
  return {
    session_id: sessionId,
    first: session.first,
    last: session.last,
    duration_ms: session.duration_ms,
    max_scroll: session.max_scroll,
    high_intent: session.high_intent,
    outcomes: session.outcomes,
    events: sessionEvents,
    context: {
      device: session.device,
      browser: session.browser,
      operating_system: session.operating_system,
      viewport: session.viewport,
      referrer: session.referrer,
      source: session.source,
      campaign: session.campaign,
    },
  };
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  res.end(body);
}

function resolveStaticFile(pathname) {
  if (pathname === '/') return path.join(ROOT, 'index.html');
  if (pathname === '/analytics' || pathname === '/analytics/' || pathname === '/analytics-dashboard.html') {
    return path.join(ROOT, 'analytics-dashboard.html');
  }
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  if (isProtectedAnalyticsRead(req.method, url.pathname) && !requireAnalyticsAuth(req, res)) return;

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'portfolio-analytics',
      analytics_protected: Boolean(ANALYTICS_PASSWORD),
      bigquery_configured: Boolean(bigqueryClient),
      bigquery_last_write: lastBigQueryWrite,
      time: new Date().toISOString(),
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/analytics') {
    const days = Math.max(1, Math.min(365, Number(url.searchParams.get('days') || 30)));
    const includeBots = url.searchParams.get('bots') === 'include';
    return sendJson(res, 200, aggregate(await loadAnalyticsEvents(), days, { includeBots }));
  }

  if (req.method === 'GET' && url.pathname === '/api/events') {
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 100)));
    return sendJson(res, 200, { events: (await loadAnalyticsEvents()).slice(-limit).reverse() });
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/sessions/')) {
    const sessionId = decodeURIComponent(url.pathname.slice('/api/sessions/'.length));
    const detail = sessionDetail(await loadAnalyticsEvents(), sessionId);
    return detail ? sendJson(res, 200, detail) : sendJson(res, 404, { error: 'Session not found' });
  }

  if (req.method === 'GET' && url.pathname === '/api/events.csv') {
    const events = await loadAnalyticsEvents();
    const keys = ['event_id', 'type', 'timestamp', 'session_id', 'visitor_id', 'path', 'referrer', 'viewport', 'screen', 'device', 'browser', 'operating_system', 'language', 'timezone', 'source', 'campaign', 'scroll_percent', 'target', 'section', 'duration_ms', 'visible_ratio', 'depth_percent', 'session_duration_ms', 'region'];
    const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      keys.join(','),
      ...events.map((event) => keys.map((key) => quote(typeof event[key] === 'object' ? JSON.stringify(event[key]) : event[key])).join(',')),
    ];
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="portfolio-events.csv"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.end(rows.join('\n'));
  }

  if (req.method === 'POST' && url.pathname === '/api/events') {
    try {
      const payload = await parseBody(req);
      const incoming = Array.isArray(payload) ? payload : payload.events;
      if (!Array.isArray(incoming)) return sendJson(res, 400, { error: 'Expected an events array' });
      const capped = incoming.slice(0, MAX_EVENTS_PER_REQUEST);
      const retryAfter = checkRateLimit(req, capped.length);
      if (retryAfter) {
        return sendJson(res, 429, { error: 'Rate limit exceeded', retry_after_seconds: retryAfter }, { 'Retry-After': String(retryAfter) });
      }
      const events = capped.map(normalizeEvent).filter((event) => !isDuplicate(event.event_id));
      await storeAnalyticsEvents(events);
      return sendJson(res, 202, {
        accepted: events.length,
        skipped: capped.length - events.length,
        durable_store: Boolean(bigqueryClient && lastBigQueryWrite.ok),
      });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (['GET', 'HEAD'].includes(req.method)) return serveStatic(req, res, url.pathname);
  return sendText(res, 405, 'Method not allowed');
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; draining requests`);
  server.close(() => {
    writeChain
      .catch(() => {})
      .finally(() => {
        console.log('Pending event writes flushed; exiting');
        process.exit(0);
      });
  });
  setTimeout(() => process.exit(0), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, HOST, () => {
  console.log(`Portfolio running at http://${HOST}:${PORT}`);
  console.log(`Analytics console at http://${HOST}:${PORT}/analytics`);
  console.log(`Events stored in ${EVENTS_FILE}`);
  console.log(`Analytics read access: ${ANALYTICS_PASSWORD ? `protected as ${ANALYTICS_USERNAME}` : 'disabled until ANALYTICS_PASSWORD is set'}`);
  console.log(`BigQuery analytics: ${bigqueryClient ? `${GCP_PROJECT_ID}.${ANALYTICS_DATASET}.${ANALYTICS_TABLE}` : 'disabled'}`);
});
