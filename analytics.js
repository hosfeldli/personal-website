(() => {
  'use strict';
  if (new URLSearchParams(window.location.search).get('analytics') === 'off') return;

  const endpoint = window.PORTFOLIO_ANALYTICS_ENDPOINT || '/api/events';
  const randomId = () => (window.crypto && typeof window.crypto.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const storageId = (storage, key) => {
    try {
      let value = storage.getItem(key);
      if (!value) {
        value = randomId();
        storage.setItem(key, value);
      }
      return value;
    } catch {
      return randomId();
    }
  };
  const sessionId = storageId(window.sessionStorage, 'liam_portfolio_session_id');
  const visitorId = storageId(window.localStorage, 'liam_portfolio_visitor_id');
  const startedAt = Date.now();
  const queue = [];
  const activeTargets = new WeakMap();
  const activeSections = new Map();
  const scrollMarks = new Set();
  const seenTargets = new WeakSet();
  let flushTimer;
  let closed = false;

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
      session_id: sessionId,
      visitor_id: visitorId,
      path: window.location.pathname,
      referrer,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      device: window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'pointer',
      language: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      source: params.get('utm_source') || '',
      campaign: params.get('utm_campaign') || '',
      scroll_percent: currentScrollPercent(),
    };
  }

  function track(type, data = {}) {
    queue.push({
      event_id: randomId(),
      type,
      timestamp: new Date().toISOString(),
      ...context(),
      ...data,
    });
    if (queue.length >= 8) flush();
    else {
      window.clearTimeout(flushTimer);
      flushTimer = window.setTimeout(flush, 1200);
    }
  }

  function flush(useBeacon = false) {
    if (!queue.length) return;
    const events = queue.splice(0, queue.length);
    const body = JSON.stringify({ events });
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      return;
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  }

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
    track(type, {
      ...targetData(target),
      duration_ms: Date.now() - start.time,
      input: start.input,
    });
  }

  track('page_view', {
    title: document.title,
    region: pageRegion(document.querySelector('main')),
  });

  document.addEventListener('pointerover', (event) => {
    const target = targetFor(event.target);
    if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
    activeTargets.set(target, { time: Date.now(), input: 'pointer' });
    track('hover_start', targetData(target));
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
    track('focus_start', targetData(target));
  });

  document.addEventListener('focusout', (event) => {
    const target = targetFor(event.target);
    if (target) endTarget(target, 'focus_end');
  });

  document.addEventListener('click', (event) => {
    const target = targetFor(event.target);
    if (target) track('click', targetData(target));
  }, { passive: true });

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
        if (entry.isIntersecting && ratio >= 50 && !milestones.has(`${name}:50`)) {
          milestones.add(`${name}:50`);
          track('section_milestone', { section: name, visible_ratio: 50, region: pageRegion(entry.target) });
        }
        if (entry.isIntersecting && ratio >= 85 && !milestones.has(`${name}:85`)) {
          milestones.add(`${name}:85`);
          track('section_milestone', { section: name, visible_ratio: 85, region: pageRegion(entry.target) });
        }
        if (!entry.isIntersecting && activeSections.has(entry.target)) {
          const time = activeSections.get(entry.target);
          activeSections.delete(entry.target);
          track('section_exit', { section: name, duration_ms: Date.now() - time, region: pageRegion(entry.target) });
        }
      });
    }, { threshold: [0.15, 0.5, 0.85] });
    observer.observe(section);
  });

  const attentionTimer = window.setInterval(() => {
    if (document.visibilityState !== 'visible' || !activeSections.size) return;
    activeSections.forEach((startedAt, section) => {
      track('section_attention', {
        section: section.dataset.analyticsSection,
        duration_ms: 2000,
        region: pageRegion(section),
      });
    });
  }, 2000);

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
      track('navigation_timing', {
        response_ms: Math.round(navigation.responseStart),
        dom_content_loaded_ms: Math.round(navigation.domContentLoadedEventEnd),
        load_ms: Math.round(navigation.loadEventEnd),
        transfer_size_bytes: Math.round(navigation.transferSize || 0),
      });
    }, 0);
  }, { once: true });

  function closeSession() {
    if (closed) return;
    closed = true;
    window.clearInterval(attentionTimer);
    activeSections.forEach((time, section) => track('section_exit', {
      section: section.dataset.analyticsSection,
      duration_ms: Date.now() - time,
      region: pageRegion(section),
    }));
    track('page_exit', { session_duration_ms: Date.now() - startedAt });
    flush(true);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') closeSession();
  });
  window.addEventListener('pagehide', closeSession);
})();
