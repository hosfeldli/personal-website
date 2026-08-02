/* First-party portfolio analytics v2.
   Adds: active-time measurement, Core Web Vitals, durable delivery with retry,
   friction detection (rage/dead clicks), intent signals (copy, print, outbound),
   and rolled-up attention to keep event volume low. */
(() => {
  'use strict';
  if (new URLSearchParams(window.location.search).get('analytics') === 'off') return;
  if (navigator.webdriver) return;

  const endpoint = window.PORTFOLIO_ANALYTICS_ENDPOINT || '/api/events';
  const SCHEMA = 2;
  const BOT = /bot|crawler|spider|crawling|headless|lighthouse|pagespeed|gtmetrix|pingdom|preview|slurp|bingpreview/i.test(navigator.userAgent || '');

  const randomId = () => (window.crypto && typeof window.crypto.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const readStore = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
  const writeStore = (storage, key, value) => { try { storage.setItem(key, value); } catch { /* ignore */ } };
  const storageId = (storage, key) => {
    const existing = readStore(storage, key);
    if (existing) return existing;
    const value = randomId();
    writeStore(storage, key, value);
    return value;
  };

  const sessionId = storageId(window.sessionStorage, 'liam_portfolio_session_id');
  const visitorId = storageId(window.localStorage, 'liam_portfolio_visitor_id');
  const visitCount = (() => {
    const previous = Number(readStore(window.localStorage, 'liam_portfolio_visits') || 0);
    const isNewSession = !readStore(window.sessionStorage, 'liam_portfolio_counted');
    const total = isNewSession ? previous + 1 : previous;
    if (isNewSession) {
      writeStore(window.localStorage, 'liam_portfolio_visits', String(total));
      writeStore(window.sessionStorage, 'liam_portfolio_counted', '1');
    }
    return total || 1;
  })();

  const startedAt = Date.now();
  const queue = [];
  const activeTargets = new WeakMap();
  const activeSections = new Map();
  const sectionAttention = new Map();
  const scrollMarks = new Set();
  const seenTargets = new WeakSet();
  const recentClicks = [];
  let flushTimer;
  let attentionFlushAt = Date.now();
  let closed = false;
  let deliveryFailures = 0;

  /* ---------- active time: only counts visible, non-idle time ---------- */
  const IDLE_AFTER_MS = 30000;
  let activeMs = 0;
  let lastTick = Date.now();
  let lastInteraction = Date.now();
  const isActive = () => document.visibilityState === 'visible' && (Date.now() - lastInteraction) < IDLE_AFTER_MS;
  const tickActive = () => {
    const now = Date.now();
    if (isActive()) activeMs += Math.min(now - lastTick, 5000);
    lastTick = now;
  };
  ['pointerdown', 'keydown', 'scroll', 'pointermove', 'touchstart'].forEach((type) => {
    window.addEventListener(type, () => { lastInteraction = Date.now(); }, { passive: true, capture: true });
  });

  /* ---------- Core Web Vitals ---------- */
  const vitals = { lcp: null, cls: 0, inp: null, fcp: null, ttfb: null };
  const observe = (type, callback, options = {}) => {
    try {
      const observer = new PerformanceObserver((list) => callback(list.getEntries(), observer));
      observer.observe({ type, buffered: true, ...options });
      return observer;
    } catch { return null; }
  };
  observe('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1];
    if (last) vitals.lcp = Math.round(last.startTime);
  });
  observe('paint', (entries) => {
    const fcp = entries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcp) vitals.fcp = Math.round(fcp.startTime);
  });
  (() => {
    let windowValue = 0;
    let windowStart = 0;
    let windowLast = 0;
    observe('layout-shift', (entries) => {
      entries.forEach((entry) => {
        if (entry.hadRecentInput) return;
        if (windowValue && (entry.startTime - windowLast > 1000 || entry.startTime - windowStart > 5000)) {
          vitals.cls = Math.max(vitals.cls, windowValue);
          windowValue = 0;
        }
        if (!windowValue) windowStart = entry.startTime;
        windowLast = entry.startTime;
        windowValue += entry.value;
        vitals.cls = Math.max(vitals.cls, windowValue);
      });
    });
  })();
  observe('event', (entries) => {
    entries.forEach((entry) => {
      const value = Math.round(entry.duration);
      if (!Number.isFinite(value)) return;
      if (vitals.inp === null || value > vitals.inp) vitals.inp = value;
    });
  }, { durationThreshold: 40 });

  /* ---------- context ---------- */
  function pageRegion(element) {
    if (!element || !element.getBoundingClientRect) return null;
    const rect = element.getBoundingClientRect();
    const documentElement = document.documentElement;
    const pageWidth = Math.max(documentElement.clientWidth, window.innerWidth, 1);
    const pageHeight = Math.max(documentElement.scrollHeight, window.innerHeight, 1);
    const clamp = (value) => Math.max(0, Math.min(100, Math.round(value * 100) / 100));
    return {
      x: clamp((rect.left + window.scrollX) / pageWidth * 100),
      y: clamp((rect.top + window.scrollY) / pageHeight * 100),
      width: clamp(rect.width / pageWidth * 100),
      height: clamp(rect.height / pageHeight * 100),
    };
  }

  function currentScrollPercent() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
  }

  function context() {
    const params = new URLSearchParams(window.location.search);
    let referrer = '';
    try { referrer = document.referrer ? new URL(document.referrer).origin : ''; } catch { referrer = ''; }
    return {
      schema_version: SCHEMA,
      session_id: sessionId,
      visitor_id: visitorId,
      visit_count: visitCount,
      is_bot: BOT,
      path: window.location.pathname,
      referrer,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      device: window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'pointer',
      browser: (() => { const ua = navigator.userAgent || ''; if (/Edg\//.test(ua)) return 'Edge'; if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome'; if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari'; if (/Firefox\//.test(ua)) return 'Firefox'; return 'Other'; })(),
      operating_system: (() => { const ua = navigator.userAgent || ''; if (/Windows/.test(ua)) return 'Windows'; if (/Mac OS X/.test(ua)) return 'macOS'; if (/Android/.test(ua)) return 'Android'; if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'; if (/Linux/.test(ua)) return 'Linux'; return 'Other'; })(),
      connection: (() => { const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection; return c ? { type: c.effectiveType || '', save_data: Boolean(c.saveData), downlink: Number.isFinite(c.downlink) ? Math.round(c.downlink * 10) / 10 : null, rtt: Number.isFinite(c.rtt) ? Math.round(c.rtt) : null } : null; })(),
      language: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      source: params.get('utm_source') || '',
      campaign: params.get('utm_campaign') || '',
      medium: params.get('utm_medium') || '',
      scroll_percent: currentScrollPercent(),
      active_ms: activeMs,
    };
  }

  function track(type, data = {}) {
    tickActive();
    queue.push({ event_id: randomId(), type, timestamp: new Date().toISOString(), ...context(), ...data });
    if (queue.length >= 10) flush();
    else {
      window.clearTimeout(flushTimer);
      flushTimer = window.setTimeout(flush, 1500);
    }
  }

  /* ---------- durable delivery: retry, then persist for the next page load ---------- */
  const PENDING_KEY = 'liam_portfolio_pending';

  function persistPending(events) {
    try {
      const existing = JSON.parse(readStore(window.localStorage, PENDING_KEY) || '[]');
      const merged = [...existing, ...events].slice(-120);
      writeStore(window.localStorage, PENDING_KEY, JSON.stringify(merged));
    } catch { /* ignore */ }
  }

  function drainPending() {
    const raw = readStore(window.localStorage, PENDING_KEY);
    if (!raw) return;
    try { window.localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
    try {
      const events = JSON.parse(raw);
      if (Array.isArray(events) && events.length) send(events, false, 0);
    } catch { /* ignore */ }
  }

  function send(events, useBeacon, attempt) {
    const body = JSON.stringify({ events });
    if (useBeacon && navigator.sendBeacon) {
      const delivered = navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      if (!delivered) persistPending(events);
      return;
    }
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
      .then((response) => {
        if (response.ok) {
          deliveryFailures = 0;
          return;
        }
        const retryAfter = Number(response.headers.get('Retry-After'));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 30000)
          : 1000 * 2 ** attempt;
        throw Object.assign(new Error(String(response.status)), { delay });
      })
      .catch((error) => {
        deliveryFailures += 1;
        if (attempt < 2) {
          window.setTimeout(() => send(events, false, attempt + 1), error.delay || 1000 * 2 ** attempt);
        } else {
          persistPending(events);
        }
      });
  }

  function flush(useBeacon = false) {
    if (!queue.length) return;
    send(queue.splice(0, queue.length), useBeacon, 0);
  }

  /* ---------- targets ---------- */
  function targetFor(node) {
    return node instanceof Element ? node.closest('[data-analytics-id]') : null;
  }

  function targetData(target) {
    return target ? {
      target: target.dataset.analyticsId,
      label: (target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
      region: pageRegion(target),
    } : {};
  }

  function endTarget(target, type) {
    const start = activeTargets.get(target);
    if (!start) return;
    activeTargets.delete(target);
    const duration = Date.now() - start.time;
    if (duration < 120) return;
    track(type, { ...targetData(target), duration_ms: duration, input: start.input });
  }

  drainPending();
  // Deliver the first page view immediately. Waiting for the normal 1.5s
  // batching window loses visits when the user navigates away quickly.
  track('page_view', { title: document.title, region: pageRegion(document.querySelector('main')) });
  flush();

  document.addEventListener('pointerover', (event) => {
    const target = targetFor(event.target);
    if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
    activeTargets.set(target, { time: Date.now(), input: 'pointer' });
  }, { passive: true });

  document.addEventListener('pointerout', (event) => {
    const target = targetFor(event.target);
    if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
    endTarget(target, 'hover_end');
  }, { passive: true });

  document.addEventListener('focusin', (event) => {
    const target = targetFor(event.target);
    if (!target) return;
    activeTargets.set(target, { time: Date.now(), input: 'keyboard' });
  });

  document.addEventListener('focusout', (event) => {
    const target = targetFor(event.target);
    if (target) endTarget(target, 'focus_end');
  });

  /* ---------- clicks, including rage and dead clicks ---------- */
  document.addEventListener('click', (event) => {
    const target = targetFor(event.target);
    const now = Date.now();
    recentClicks.push({ x: event.clientX, y: event.clientY, time: now });
    while (recentClicks.length && now - recentClicks[0].time > 1200) recentClicks.shift();
    const cluster = recentClicks.filter((click) => Math.hypot(click.x - event.clientX, click.y - event.clientY) < 40);
    if (cluster.length >= 3) {
      recentClicks.length = 0;
      track('rage_click', { ...targetData(target), click_count: cluster.length, region: pageRegion(target || document.body) });
    }

    if (target) {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      const href = link?.getAttribute('href') || '';
      let kind = 'action';
      if (href.startsWith('mailto:')) kind = 'email';
      else if (link?.hasAttribute('download')) kind = 'download';
      else if (/^https?:/i.test(href) && !href.includes(window.location.host)) kind = 'outbound';
      else if (href.startsWith('#')) kind = 'anchor';
      track('click', { ...targetData(target), click_kind: kind, href: href.slice(0, 200) });
      if (kind === 'download') track('resume_download', { ...targetData(target), href: href.slice(0, 200) });
      if (kind === 'outbound') track('outbound_click', { ...targetData(target), href: href.slice(0, 200) });
    } else {
      const interactive = event.target instanceof Element
        && event.target.closest('a, button, summary, input, select, textarea, dialog, [role="button"]');
      if (!interactive && window.getSelection()?.toString().length === 0) {
        track('dead_click', { region: pageRegion(event.target instanceof Element ? event.target : document.body) });
      }
    }
  }, { passive: true });

  /* ---------- high-intent signals ---------- */
  document.addEventListener('copy', () => {
    const text = (window.getSelection()?.toString() || '').trim();
    if (!text) return;
    const kind = /@/.test(text) ? 'email' : /\d{3}[^\d]?\d{3}[^\d]?\d{4}/.test(text) ? 'phone' : 'text';
    track('copy', { copy_kind: kind, text_length: text.length });
  });

  window.addEventListener('beforeprint', () => track('print'));

  document.addEventListener('selectionchange', (() => {
    let timer;
    return () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const length = (window.getSelection()?.toString() || '').trim().length;
        if (length >= 25) track('text_selection', { text_length: length });
      }, 700);
    };
  })());

  window.addEventListener('error', (event) => {
    track('js_error', { message: String(event.message || '').slice(0, 200), error_source: String(event.filename || '').slice(0, 160), error_line: event.lineno || 0 });
  });
  window.addEventListener('unhandledrejection', () => track('js_error', { message: 'unhandled_rejection' }));

  /* ---------- impressions ---------- */
  const targetObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || seenTargets.has(entry.target)) return;
      seenTargets.add(entry.target);
      track('target_view', targetData(entry.target));
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-analytics-id]').forEach((target) => targetObserver.observe(target));

  document.querySelectorAll('[data-analytics-section]').forEach((section) => {
    const milestones = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const name = entry.target.dataset.analyticsSection;
        const ratio = Math.round(entry.intersectionRatio * 100);
        if (entry.isIntersecting && !activeSections.has(entry.target)) {
          activeSections.set(entry.target, Date.now());
          track('section_view', { section: name, visible_ratio: ratio, region: pageRegion(entry.target) });
        }
        [50, 85].forEach((mark) => {
          if (entry.isIntersecting && ratio >= mark && !milestones.has(`${name}:${mark}`)) {
            milestones.add(`${name}:${mark}`);
            track('section_milestone', { section: name, visible_ratio: mark, region: pageRegion(entry.target) });
          }
        });
        if (!entry.isIntersecting && activeSections.has(entry.target)) {
          const time = activeSections.get(entry.target);
          activeSections.delete(entry.target);
          track('section_exit', { section: name, duration_ms: Date.now() - time, region: pageRegion(entry.target) });
        }
      });
    }, { threshold: [0.15, 0.5, 0.85] });
    observer.observe(section);
  });

  /* ---------- attention: accumulate locally, emit a rollup every 15s ---------- */
  function flushAttention(force = false) {
    const now = Date.now();
    if (!force && now - attentionFlushAt < 15000) return;
    attentionFlushAt = now;
    sectionAttention.forEach((ms, section) => {
      if (ms < 500) return;
      track('section_attention', {
        section: section.dataset.analyticsSection,
        duration_ms: Math.round(ms),
        region: pageRegion(section),
      });
    });
    sectionAttention.clear();
  }

  const attentionTimer = window.setInterval(() => {
    tickActive();
    if (!isActive() || !activeSections.size) return;
    activeSections.forEach((_startedAt, section) => {
      sectionAttention.set(section, (sectionAttention.get(section) || 0) + 1000);
    });
    flushAttention();
  }, 1000);

  function scrollDepth() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const percent = Math.min(100, Math.round((window.scrollY / max) * 100));
    [25, 50, 75, 90, 100].forEach((mark) => {
      if (percent >= mark && !scrollMarks.has(mark)) {
        scrollMarks.add(mark);
        track('scroll_depth', { depth_percent: mark });
      }
    });
  }
  window.addEventListener('scroll', scrollDepth, { passive: true });

  window.addEventListener('load', () => {
    window.setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (!navigation) return;
      vitals.ttfb = Math.round(navigation.responseStart);
      const resources = performance.getEntriesByType('resource');
      track('navigation_timing', {
        response_ms: Math.round(navigation.responseStart),
        dom_content_loaded_ms: Math.round(navigation.domContentLoadedEventEnd),
        load_ms: Math.round(navigation.loadEventEnd),
        transfer_size_bytes: Math.round(navigation.transferSize || 0),
        resource_count: resources.length,
        resource_bytes: Math.round(resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0)),
      });
    }, 0);
  }, { once: true });

  function reportVitals() {
    if (vitals.lcp === null && vitals.inp === null && !vitals.cls) return;
    track('web_vitals', {
      lcp_ms: vitals.lcp,
      fcp_ms: vitals.fcp,
      ttfb_ms: vitals.ttfb,
      inp_ms: vitals.inp,
      cls: Math.round(vitals.cls * 1000) / 1000,
    });
  }

  function closeSession() {
    if (closed) return;
    closed = true;
    tickActive();
    window.clearInterval(attentionTimer);
    activeSections.forEach((time, section) => track('section_exit', {
      section: section.dataset.analyticsSection,
      duration_ms: Date.now() - time,
      region: pageRegion(section),
    }));
    flushAttention(true);
    reportVitals();
    track('page_exit', {
      session_duration_ms: Date.now() - startedAt,
      active_ms: activeMs,
      engaged_ratio: Math.round((activeMs / Math.max(1, Date.now() - startedAt)) * 100),
      max_scroll_percent: Math.max(0, ...scrollMarks, currentScrollPercent()),
      delivery_failures: deliveryFailures,
    });
    flush(true);
  }

  document.addEventListener('visibilitychange', () => {
    tickActive();
    if (document.visibilityState === 'hidden') {
      flushAttention(true);
      reportVitals();
      flush(true);
    } else {
      lastTick = Date.now();
      lastInteraction = Date.now();
    }
  });
  window.addEventListener('pagehide', closeSession);
})();
