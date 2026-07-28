const daysSelect = document.querySelector('#days');
const refreshButton = document.querySelector('#refresh');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
const duration = (ms) => { const seconds = Math.round(Number(ms || 0) / 1000); if (seconds < 60) return `${seconds}s`; const minutes = Math.floor(seconds / 60); return `${minutes}m ${seconds % 60}s`; };
const number = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));
const table = (headers, rows, empty = 'No events recorded in this window.') => rows.length ? `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>` : `<p class="empty">${empty}</p>`;
const rowTable = (rows) => table(['Category','Value','Count'], rows.map((row) => `<tr><td>${escapeHtml(row.category)}</td><td>${escapeHtml(row.value || '—')}</td><td class="num">${number(row.count)}</td></tr>`));

function renderHotZone(data) {
  const sections = (data.sections || []).filter((row) => row.region);
  const zones = data.hot_zones || [];
  const scrollHeat = data.scroll_heat || [];
  const maxTarget = Math.max(...zones.map((zone) => zone.score || 0), 1);
  const maxScroll = Math.max(...scrollHeat.map((row) => row.score || 0), 1);
  const sectionMax = Math.max(...sections.map((section) => section.heat_score || 0), 1);
  const sectionMarkup = sections.map((section) => {
    const heat = Math.max(.05, Math.min(1, (section.heat_score || 0) / sectionMax));
    return `<div class="real-section-overlay" data-section="${escapeHtml(section.section)}" style="left:${section.region.x}%;top:${section.region.y}%;width:${section.region.width}%;height:${section.region.height}%;--section-heat:${heat}"><span>${escapeHtml(section.section)}</span></div>`;
  }).join('');
  const scrollMarkup = scrollHeat.filter((row) => row.score > 0).map((row) => {
    const heat = Math.max(.08, Math.min(1, (row.score || 0) / maxScroll));
    return `<div class="real-scroll-band" style="top:${row.percent}%;--scroll-heat:${heat}"></div>`;
  }).join('');
  const zoneMarkup = zones.slice(0, 100).map((zone) => {
    const heat = Math.max(.14, Math.min(1, (zone.score || 0) / maxTarget));
    const region = zone.region;
    return `<div class="real-hot-spot" data-label="${escapeHtml(zone.target)} · ${number(zone.views)} views · ${number(zone.hovers)} hovers · ${number(zone.clicks)} clicks · ${duration(zone.dwell_ms)} dwell" style="left:${region.x}%;top:${region.y}%;width:${Math.max(region.width, .8)}%;height:${Math.max(region.height, .8)}%;--heat:${heat}"></div>`;
  }).join('');
  const targetMarkup = `<div class="real-page-viewport"><div class="real-page-stage"><iframe class="real-page-frame" src="/?analytics=off&preview=1" title="Live portfolio page preview for heat overlay"></iframe><div class="real-scroll-layer">${scrollMarkup}</div><div class="real-section-layer">${sectionMarkup}</div><div class="real-target-layer">${zoneMarkup}</div></div></div>`;
  document.querySelector('#hot-zone').innerHTML = targetMarkup;
  const iframe = document.querySelector('.real-page-frame');
  const stage = document.querySelector('.real-page-stage');
  const layout = () => {
    try {
      const doc = iframe.contentDocument;
      const height = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0, 1200);
      stage.style.height = `${height}px`;
      iframe.style.height = `${height}px`;
      document.querySelector('.real-scroll-layer').style.height = `${height}px`;
      document.querySelector('.real-section-layer').style.height = `${height}px`;
      document.querySelector('.real-target-layer').style.height = `${height}px`;
    } catch { stage.style.height = '2400px'; }
  };
  iframe.addEventListener('load', layout, { once: true });
  window.setTimeout(layout, 600);
}

function renderActions(data) {
  const output = document.querySelector('#actions');
  const zones = data.hot_zones || [];
  const sections = data.sections || [];
  const actions = [];
  const top = zones[0];
  if (top) actions.push({ tone: 'warm', title: `Prioritize ${top.target}`, body: `${number(top.views)} views, ${number(top.hovers)} hovers, ${number(top.clicks)} clicks, and ${duration(top.dwell_ms)} of dwell make this the strongest observed interaction target.` });
  const hoverGap = zones.find((zone) => zone.hovers >= 2 && zone.clicks === 0);
  if (hoverGap) actions.push({ tone: 'rust', title: `Clarify ${hoverGap.target}`, body: `Visitors hover this target but have not clicked it. Review its label, affordance, or next action.` });
  const dwell = [...sections].sort((a, b) => b.dwell_ms - a.dwell_ms)[0];
  if (dwell) actions.push({ tone: 'sage', title: `Protect ${dwell.section}`, body: `${duration(dwell.dwell_ms)} of recorded section dwell indicates sustained attention. Keep its hierarchy and content density.` });
  if (Number(data.totals?.average_scroll_percent || 0) < 60) actions.push({ tone: 'mustard', title: 'Move a key proof point upward', body: `Average scroll depth is ${number(data.totals.average_scroll_percent)}%. Put the next important result before the current drop-off.` });
  if (!actions.length) actions.push({ tone: 'cool', title: 'Collecting baseline activity', body: 'Open the portfolio, interact with the tiles, and return here to generate recommendations.' });
  output.innerHTML = actions.slice(0, 4).map((action) => `<article class="action-item action-${action.tone}"><strong>${escapeHtml(action.title)}</strong><p>${escapeHtml(action.body)}</p></article>`).join('');
}

async function load() {
  refreshButton.textContent = 'Loading…';
  try {
    const response = await fetch(`/api/analytics?days=${daysSelect.value}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Analytics endpoint unavailable');
    const data = await response.json();
    const t = data.totals;
    document.querySelector('#summary').innerHTML = [
      ['Events', number(t.events), `${data.days}-day window`],
      ['Sessions', number(t.sessions), `${number(t.visitors)} anonymous visitors`],
      ['Avg. session', duration(t.average_session_ms), `${number(t.engaged_sessions)} engaged sessions`],
      ['Avg. scroll', `${number(t.average_scroll_percent)}%`, 'maximum depth per session'],
    ].map(([label, value, detail]) => `<article class="summary-card"><small>${label}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(detail)}</span></article>`).join('');
    renderHotZone(data);
    renderActions(data);
    document.querySelector('#sections-table').innerHTML = table(['Section','Views','Dwell','Milestones'], (data.sections || []).map((row) => `<tr><td>${escapeHtml(row.section)}</td><td class="num">${number(row.views)}</td><td class="num">${duration(row.dwell_ms)}</td><td class="num">${number(row.milestones)}</td></tr>`));
    document.querySelector('#targets-table').innerHTML = table(['Target','Views','Hover','Click','Dwell'], (data.targets || []).slice(0, 14).map((row) => `<tr><td><strong>${escapeHtml(row.target)}</strong><br /><small>${escapeHtml(row.label)}</small></td><td class="num">${number(row.views)}</td><td class="num">${number(row.hovers)}</td><td class="num">${number(row.clicks)}</td><td class="num">${duration(row.dwell_ms)}</td></tr>`));
    const nav = data.navigation || {};
    const contextRows = [];
    [['Path', nav.paths], ['Referrer', nav.referrers], ['Device', nav.devices], ['Viewport', nav.viewports], ['Language', nav.languages], ['Timezone', nav.timezones], ['Source', nav.sources], ['Campaign', nav.campaigns]].forEach(([category, rows]) => (rows || []).slice(0, 4).forEach((row) => contextRows.push({ category, value: row.value, count: row.count })));
    document.querySelector('#navigation-table').innerHTML = `<div class="context-table">${rowTable(contextRows)}</div>`;
    document.querySelector('#events-table').innerHTML = table(['Event','Count'], (data.event_types || []).map((row) => `<tr><td>${escapeHtml(row.type)}</td><td class="num">${number(row.count)}</td></tr>`));
    document.querySelector('#sessions-table').innerHTML = table(['Session','Events','Max scroll','Started','Last activity'], (data.sessions || []).map((row) => `<tr><td>${escapeHtml(row.session_id.slice(0, 8))}…</td><td class="num">${number(row.events)}</td><td class="num">${number(row.max_scroll)}%</td><td>${new Date(row.first).toLocaleString()}</td><td>${new Date(row.last).toLocaleString()}</td></tr>`));
  } catch (error) {
    document.querySelector('#summary').innerHTML = `<article class="summary-card" style="grid-column:1/-1;background:#59392d;color:#efe4d0"><strong>Analytics unavailable</strong><span>${escapeHtml(error.message)}. Start the portfolio with <code>npm start</code>.</span></article>`;
  } finally { refreshButton.textContent = 'Refresh ↻'; }
}
daysSelect.addEventListener('change', load);
refreshButton.addEventListener('click', load);
load();
