'use strict';

const daysSelect = document.querySelector('#days');
const refreshButton = document.querySelector('#refresh');
const trendMetricSelect = document.querySelector('#trend-metric');
let trendData = [];
let trendMetric = 'sessions';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));
const number = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));
const duration = (ms) => {
  const seconds = Math.max(0, Math.round(Number(ms || 0) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
};
const table = (headers, rows, empty = 'No data in this window.') => rows.length
  ? `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`
  : `<p class="empty">${escapeHtml(empty)}</p>`;

function deltaMarkup(comparison, invert = false) {
  if (!comparison || comparison.delta === null || comparison.delta === 0) return '';
  const favorable = invert ? comparison.delta < 0 : comparison.delta > 0;
  const arrow = comparison.delta > 0 ? '↑' : '↓';
  return `<span class="delta ${favorable ? 'up' : 'down'}">${arrow}${Math.abs(comparison.delta)}%</span>`;
}

function renderSummary(data) {
  const totals = data.totals || {};
  const comparison = data.comparison || {};
  const cards = [
    { label: 'Sessions', value: number(totals.sessions), detail: `${number(totals.visitors)} unique visitors`, comparison: comparison.sessions, primary: true },
    { label: 'Engagement rate', value: `${number(totals.engagement_rate)}%`, detail: `${number(totals.engaged_sessions)} engaged sessions`, comparison: comparison.engagement_rate },
    { label: 'High-intent rate', value: `${number(totals.high_intent_rate)}%`, detail: `${number(totals.high_intent_sessions)} hiring-intent sessions`, comparison: comparison.high_intent_rate },
    { label: 'Résumé sessions', value: number(totals.resume_sessions), detail: 'Unique sessions with a résumé click' },
    { label: 'Median session', value: duration(totals.median_session_ms), detail: `Average ${duration(totals.average_session_ms)}`, comparison: comparison.average_session_ms },
    { label: 'Average scroll', value: `${number(totals.average_scroll_percent)}%`, detail: `${number(totals.quick_exit_rate)}% quick-exit rate`, comparison: comparison.average_scroll_percent },
    { label: 'Active reading time', value: duration(totals.median_active_ms), detail: `${number(totals.active_ratio)}% of session time is active`, comparison: comparison.average_active_ms },
    { label: 'Returning sessions', value: `${number(totals.returning_rate)}%`, detail: `${number(totals.returning_sessions)} sessions from repeat visitors`, comparison: comparison.returning_rate },
    { label: 'Friction rate', value: `${number(totals.frustrated_rate)}%`, detail: `${number(totals.frustrated_sessions)} sessions hit a rage click, dead click, or error`, comparison: comparison.frustrated_rate, invert: true },
  ];
  document.querySelector('#summary').innerHTML = cards.map((card) => `
    <article class="kpi-card ${card.primary ? 'primary' : ''}">
      <small>${escapeHtml(card.label)}</small>
      <strong>${escapeHtml(card.value)}${deltaMarkup(card.comparison, card.invert)}</strong>
      <span>${escapeHtml(card.detail)}</span>
    </article>`).join('');
}

function renderFunnel(rows) {
  const output = document.querySelector('#funnel');
  output.innerHTML = (rows || []).map((row) => `
    <div class="funnel-row">
      <span class="funnel-label">${escapeHtml(row.label)}</span>
      <span class="funnel-track"><span class="funnel-fill" style="width:${Math.max(row.rate, row.value ? 3 : 0)}%">${row.value ? number(row.value) : ''}</span></span>
      <span class="funnel-value">${number(row.rate)}%</span>
    </div>`).join('') || '<p class="empty">No funnel data in this window.</p>';
}

function renderRecommendations(rows) {
  document.querySelector('#recommendations').innerHTML = (rows || []).map((row) => `
    <article class="recommendation ${escapeHtml(row.tone)}">
      <strong>${escapeHtml(row.title)}</strong>
      <p>${escapeHtml(row.body)}</p>
    </article>`).join('') || '<p class="empty">No recommendations yet.</p>';
}

function renderTrend() {
  const chart = document.querySelector('#trend-chart');
  if (!trendData.length) {
    chart.innerHTML = '<p class="empty">No trend data in this window.</p>';
    return;
  }
  const values = trendData.map((row) => Number(row[trendMetric] || 0));
  const max = Math.max(...values, 1);
  const width = 1000;
  const height = 260;
  const padding = { top: 22, right: 18, bottom: 35, left: 45 };
  const x = (index) => padding.left + (trendData.length === 1 ? 0 : index * (width - padding.left - padding.right) / (trendData.length - 1));
  const y = (value) => height - padding.bottom - (value / max) * (height - padding.top - padding.bottom);
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const area = `${padding.left},${height - padding.bottom} ${points} ${x(values.length - 1)},${height - padding.bottom}`;
  const labelStep = Math.max(1, Math.ceil(trendData.length / 6));
  const labels = trendData.map((row, index) => (index === 0 || index === trendData.length - 1 || index % labelStep === 0)
    ? `<text class="chart-label" x="${x(index)}" y="${height - 12}" text-anchor="${index === 0 ? 'start' : index === trendData.length - 1 ? 'end' : 'middle'}">${escapeHtml(row.date.slice(5))}</text>`
    : '').join('');
  const dots = values.map((value, index) => `<circle class="trend-dot" cx="${x(index)}" cy="${y(value)}" r="3"><title>${escapeHtml(trendData[index].date)}: ${number(value)}</title></circle>`).join('');
  chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <line class="chart-axis" x1="${padding.left}" x2="${padding.left}" y1="${padding.top}" y2="${height - padding.bottom}" />
    <line class="chart-axis" x1="${padding.left}" x2="${width - padding.right}" y1="${height - padding.bottom}" y2="${height - padding.bottom}" />
    <polygon class="trend-area" points="${area}" />
    <polyline class="trend-line" points="${points}" />
    ${dots}${labels}
    <text class="chart-label" x="${padding.left}" y="${padding.top - 5}">${number(max)}</text>
  </svg>`;
}

function renderSections(rows) {
  document.querySelector('#sections').innerHTML = (rows || []).map((row) => `
    <div class="performance-row">
      <span class="performance-label">${escapeHtml(row.label)}</span>
      <span class="performance-track"><span class="performance-fill" style="width:${row.reach_rate}%"></span></span>
      <span class="performance-value">${number(row.reach_rate)}%</span>
      <span class="performance-meta">${number(row.sessions)} sessions · ${duration(row.avg_dwell_ms)} average dwell</span>
    </div>`).join('') || '<p class="empty">No section data in this window.</p>';
}

function renderCtas(rows) {
  document.querySelector('#cta-performance').innerHTML = (rows || []).map((row) => `
    <div class="performance-row">
      <span class="performance-label">${escapeHtml(row.label)}</span>
      <span class="performance-track"><span class="performance-fill" style="width:${Math.min(100, row.click_rate)}%"></span></span>
      <span class="performance-value">${number(row.click_rate)}%</span>
      <span class="performance-meta">${number(row.clicked_sessions)} clicked sessions from ${number(row.viewed_sessions)} viewed sessions</span>
    </div>`).join('') || '<p class="empty">No CTA data in this window.</p>';
}

function renderWebVitals(data) {
  const output = document.querySelector('#web-vitals');
  if (!output) return;
  const vitals = data || { metrics: [], samples: 0 };
  if (!vitals.samples) {
    output.innerHTML = '<p class="empty">No Core Web Vitals samples yet. They arrive once visitors load the updated page.</p>';
    return;
  }
  output.innerHTML = vitals.metrics.map((metric) => {
    const scale = metric.poor_threshold * 1.25;
    const width = Math.max(2, Math.min(100, (metric.p75 / scale) * 100));
    const value = metric.unit === 'ms' ? `${number(metric.p75)}ms` : metric.p75;
    return `
    <div class="performance-row">
      <span class="performance-label">${escapeHtml(metric.label)} <small class="vital-${escapeHtml(metric.rating)}">${escapeHtml(metric.rating)}</small></span>
      <span class="performance-track"><span class="performance-fill vital-fill-${escapeHtml(metric.rating)}" style="width:${width}%"></span></span>
      <span class="performance-value">${escapeHtml(String(value))}</span>
      <span class="performance-meta">${number(metric.samples)} samples · good under ${metric.good_threshold}${escapeHtml(metric.unit)} · median ${metric.p50}${escapeHtml(metric.unit)}</span>
    </div>`;
  }).join('');
}

function renderFriction(data) {
  const output = document.querySelector('#friction');
  if (!output) return;
  const friction = data || {};
  const rows = [
    ['Rage clicks', friction.rage_clicks, `${number(friction.rage_sessions)} sessions`, friction.top_rage_targets?.[0]?.value || '—'],
    ['Dead clicks', friction.dead_clicks, `${number(friction.dead_sessions)} sessions`, friction.top_dead_zones?.[0]?.value || '—'],
    ['JavaScript errors', friction.js_errors, `${number(friction.error_sessions)} sessions`, friction.top_errors?.[0]?.value || '—'],
    ['Delivery retries', friction.delivery_failure_events, 'events needing retry', '—'],
  ].map(([label, count, detail, top]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td class="num">${number(count)}</td>
      <td>${escapeHtml(detail)}</td>
      <td>${escapeHtml(String(top).slice(0, 60))}</td>
    </tr>`);
  output.innerHTML = table(['Signal', 'Count', 'Reach', 'Most common'], rows);
}

function renderIntent(data) {
  const output = document.querySelector('#intent');
  if (!output) return;
  const intent = data || {};
  const rows = [
    ['Résumé downloads', intent.resume_downloads, intent.resume_download_sessions],
    ['Email address copied', intent.email_copies, intent.email_copy_sessions],
    ['Printed or saved as PDF', intent.prints, intent.print_sessions],
    ['Outbound clicks (LinkedIn)', intent.outbound_clicks, intent.outbound_sessions],
    ['Meaningful text selections', intent.text_selections, null],
  ].map(([label, count, sessions]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td class="num">${number(count)}</td>
      <td class="num">${sessions === null ? '—' : number(sessions)}</td>
    </tr>`);
  output.innerHTML = table(['Signal', 'Events', 'Sessions'], rows);
}

function renderDataQuality(data) {
  const output = document.querySelector('#data-quality');
  if (!output) return;
  const quality = data || {};
  const rows = [
    ['Bot events excluded', quality.bot_events_excluded],
    ['Bot sessions excluded', quality.bot_sessions_excluded],
    ['Events on schema v2', quality.schema_v2_events],
    ['Total events in window', quality.total_events_in_window],
  ].map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td class="num">${number(value)}</td></tr>`);
  output.innerHTML = table(['Measure', 'Count'], rows);
}

function renderAcquisition(data) {
  const rows = [];
  for (const [category, values] of Object.entries(data || {})) {
    for (const row of (values || []).slice(0, 5)) {
      if (!row.value) continue;
      rows.push(`<tr><td>${escapeHtml(category)}</td><td>${escapeHtml(row.value)}</td><td class="num">${number(row.count)}</td></tr>`);
    }
  }
  document.querySelector('#acquisition').innerHTML = table(['Category', 'Value', 'Count'], rows);
}

function outcomeBadges(outcomes) {
  return `<span class="intent-badges">${(outcomes || []).map((outcome) => `<span>${escapeHtml(outcome)}</span>`).join('')}</span>`;
}

function renderHighIntent(rows) {
  document.querySelector('#high-intent').innerHTML = table(['Session', 'Outcomes', 'Duration', 'Scroll'], (rows || []).map((row) => `
    <tr>
      <td><button class="session-button" data-session-id="${escapeHtml(row.session_id)}">${escapeHtml(row.session_id.slice(0, 8))}…</button></td>
      <td>${outcomeBadges(row.outcomes)}</td>
      <td>${duration(row.duration_ms)}</td>
      <td class="num">${number(row.max_scroll)}%</td>
    </tr>`), 'No high-intent sessions in this window.');
}

function renderSessions(rows) {
  document.querySelector('#sessions').innerHTML = table(['Session', 'Started', 'Duration', 'Scroll', 'Signals', 'Device'], (rows || []).map((row) => `
    <tr>
      <td><button class="session-button" data-session-id="${escapeHtml(row.session_id)}">${escapeHtml(row.session_id.slice(0, 8))}…</button></td>
      <td>${escapeHtml(new Date(row.first).toLocaleString())}</td>
      <td>${duration(row.duration_ms)}</td>
      <td class="num">${number(row.max_scroll)}%</td>
      <td>${row.outcomes?.length ? outcomeBadges(row.outcomes) : (row.engaged ? 'Engaged' : 'Passive')}</td>
      <td>${escapeHtml(`${row.device || 'Unknown'} · ${row.browser || 'Unknown'}`)}</td>
    </tr>`));
}

function renderDiagnostics(data) {
  document.querySelector('#targets').innerHTML = table(['Target', 'Views', 'Clicks', 'Dwell'], (data.targets || []).slice(0, 15).map((row) => `
    <tr><td>${escapeHtml(row.target)}</td><td class="num">${number(row.views)}</td><td class="num">${number(row.clicks)}</td><td class="num">${duration(row.dwell_ms)}</td></tr>`));
  document.querySelector('#event-types').innerHTML = table(['Event', 'Count'], (data.event_types || []).map((row) => `
    <tr><td>${escapeHtml(row.type)}</td><td class="num">${number(row.count)}</td></tr>`));
}

async function loadSession(sessionId) {
  const detail = document.querySelector('#session-detail');
  detail.hidden = false;
  detail.innerHTML = '<p class="empty">Loading session…</p>';
  try {
    const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Session unavailable');
    const session = await response.json();
    const context = session.context || {};
    detail.innerHTML = `
      <div class="session-detail-heading">
        <div><p class="eyebrow">Session detail</p><h3>${escapeHtml(session.session_id.slice(0, 12))}…</h3><p class="session-meta">${escapeHtml(new Date(session.first).toLocaleString())} · ${duration(session.duration_ms)} · ${number(session.max_scroll)}% max scroll</p></div>
        <button class="session-close" type="button">Close</button>
      </div>
      <div class="session-context">
        <span><b>Device</b>${escapeHtml(context.operating_system || 'Unknown')} · ${escapeHtml(context.browser || 'Unknown')}</span>
        <span><b>Viewport</b>${escapeHtml(context.viewport || 'Unknown')}</span>
        <span><b>Source</b>${escapeHtml(context.source || context.referrer || 'Direct')}</span>
        <span><b>Outcomes</b>${escapeHtml((session.outcomes || []).join(', ') || 'None')}</span>
      </div>
      <ol class="event-timeline">${(session.events || []).map((event) => `
        <li><time>${escapeHtml(new Date(event.timestamp).toLocaleTimeString())}</time><strong>${escapeHtml(event.type.replaceAll('_', ' '))}</strong><span>${escapeHtml(event.section || event.target || event.path || '')}${event.duration_ms ? ` · ${duration(event.duration_ms)}` : ''}${event.depth_percent !== undefined ? ` · ${number(event.depth_percent)}% scroll` : ''}</span></li>`).join('')}</ol>`;
    detail.querySelector('.session-close').addEventListener('click', () => { detail.hidden = true; });
  } catch (error) {
    detail.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  }
}

function bindSessionButtons() {
  document.querySelectorAll('.session-button').forEach((button) => {
    button.addEventListener('click', () => loadSession(button.dataset.sessionId));
  });
}

async function load() {
  refreshButton.textContent = 'Loading…';
  try {
    const response = await fetch(`/api/analytics?days=${daysSelect.value}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(response.status === 401 ? 'Authentication required' : 'Analytics endpoint unavailable');
    const data = await response.json();
    document.querySelector('#generated-at').textContent = `Updated ${new Date(data.generated_at).toLocaleString()}`;
    renderSummary(data);
    renderFunnel(data.funnel);
    renderRecommendations(data.recommendations);
    trendData = data.trend || [];
    renderTrend();
    renderSections(data.sections);
    renderCtas(data.cta_performance);
    renderWebVitals(data.web_vitals);
    renderFriction(data.friction);
    renderIntent(data.intent);
    renderDataQuality(data.data_quality);
    renderAcquisition(data.acquisition);
    renderHighIntent(data.high_intent_sessions);
    renderSessions(data.sessions);
    renderDiagnostics(data);
    bindSessionButtons();
  } catch (error) {
    document.querySelector('#summary').innerHTML = `<article class="error-state"><strong>Analytics unavailable</strong><p>${escapeHtml(error.message)}</p></article>`;
  } finally {
    refreshButton.textContent = 'Refresh';
  }
}

daysSelect.addEventListener('change', load);
refreshButton.addEventListener('click', load);
trendMetricSelect.addEventListener('change', () => {
  trendMetric = trendMetricSelect.value;
  renderTrend();
});
load();
