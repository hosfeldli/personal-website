'use strict';
const escapeHTML = (value) => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const safeHref = (value, baseURL) => {
  try {
    const url = new URL(value, baseURL || window.location.href);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return '#';
    return escapeHTML(url.href);
  } catch { return '#'; }
};
const inline = (value, baseURL) => escapeHTML(value)
  .replace(/`([^`]+)`/g,'<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_, label, href) => `<a href="${safeHref(href, baseURL)}" target="_blank" rel="noreferrer">${label}</a>`);
function renderMarkdown(source, baseURL) {
  const lines=source.replaceAll('\r','').split('\n'); let html='', paragraph=[], list=null, inCode=false, code=[];
  const flushParagraph=()=>{if(paragraph.length){html+=`<p>${inline(paragraph.join(' '), baseURL)}</p>`;paragraph=[];}};
  const flushList=()=>{if(list){html+=`</${list}>`;list=null;}};
  const headingID=(text)=>text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  for(let i=0;i<lines.length;i+=1){const line=lines[i];
    if(line.startsWith('```')){flushParagraph();flushList();if(inCode){html+=`<pre><code>${escapeHTML(code.join('\n'))}</code></pre>`;code=[];}inCode=!inCode;continue;} if(inCode){code.push(line);continue;}
    const heading=line.match(/^(#{1,3})\s+(.+)$/); if(heading){flushParagraph();flushList();const level=heading[1].length;const id=headingID(heading[2]);html+=`<h${level} id="${id}">${inline(heading[2], baseURL)}</h${level}>`;continue;}
    if(line.startsWith('|')&&lines[i+1]?.match(/^\|?[\s:|-]+\|/)){flushParagraph();flushList();const rows=[];while(i<lines.length&&lines[i].startsWith('|')){rows.push(lines[i].split('|').slice(1,-1).map(v=>v.trim()));i+=1;}i-=1;const head=rows[0];const body=rows.slice(2);html+='<table><thead><tr>'+head.map(v=>`<th>${inline(v, baseURL)}</th>`).join('')+'</tr></thead><tbody>'+body.map(row=>'<tr>'+row.map(v=>`<td>${inline(v, baseURL)}</td>`).join('')+'</tr>').join('')+'</tbody></table>';continue;}
    const bullet=line.match(/^[-*]\s+(.+)$/);const numbered=line.match(/^\d+\.\s+(.+)$/);if(bullet||numbered){flushParagraph();const wanted=bullet?'ul':'ol';if(list!==wanted){flushList();list=wanted;html+=`<${list}>`;}html+=`<li>${inline((bullet||numbered)[1], baseURL)}</li>`;continue;}
    if(line.startsWith('> ')){flushParagraph();flushList();html+=`<blockquote>${inline(line.slice(2), baseURL)}</blockquote>`;continue;}
    if(!line.trim()){flushParagraph();flushList();continue;} paragraph.push(line.trim());
  } flushParagraph();flushList();return html;
}
const guidePromise = fetch('/api/extensions/guide', { headers: { Accept: 'application/json' } }).then(response => response.ok ? response.json() : Promise.reject(new Error('guide unavailable')));
const releasePromise = fetch('/updates/latest.json', { headers: { Accept: 'application/json' } }).then(response => response.ok ? response.json() : Promise.reject(new Error('release unavailable')));
const storePromise = fetch('/store/extensions.json', { headers: { Accept: 'application/json' } }).then(response => response.ok ? response.json() : Promise.reject(new Error('store unavailable')));

guidePromise.then(guide=>{
  const article=document.querySelector('#manual-content');article.innerHTML=renderMarkdown(guide.content, guide.sourceUrl);
  const headings=[...article.querySelectorAll('h2')];document.querySelector('#manual-toc').innerHTML=headings.map(h=>`<a href="#${h.id}">${h.textContent}</a>`).join('');
  document.querySelector('#guide-branch').textContent = `GitHub ${guide.branch}`;
  document.querySelector('#guide-path').textContent = `${guide.repository}/${guide.path}`;
  document.querySelector('#guide-source-label').textContent = guide.stale ? 'Showing the last cached GitHub copy.' : `Live from ${guide.repository}/${guide.branch}.`;
  document.querySelector('#guide-status-label').textContent = guide.stale ? 'CACHED GITHUB GUIDE' : 'LIVE GITHUB GUIDE';
  document.querySelector('#guide-source-link').href = guide.sourceUrl;
  document.querySelectorAll('[data-github-guide]').forEach(link=>{link.href=guide.sourceUrl;});
}).catch(()=>{
  document.querySelector('#guide-status-label').textContent='GITHUB GUIDE UNAVAILABLE';
  document.querySelector('#guide-source-label').textContent='Open the source on GitHub to read the current guide.';
  document.querySelector('#manual-content').innerHTML='<h1>Guide unavailable</h1><p>The live extension guide could not be fetched from GitHub. The source remains available from the GitHub link above.</p>';
});

releasePromise.then(release=>{
  document.querySelector('#guide-version').textContent = release.version || 'Latest release';
  document.querySelector('#guide-version').closest('strong').setAttribute('title', `Published ${release.publishedAt || 'recently'}`);
  document.querySelector('#guide-source-label').dataset.releaseUrl = release.releaseUrl || '';
}).catch(()=>{ document.querySelector('#guide-version').textContent = 'Release unavailable'; });

storePromise.then(store => {
  const grid = document.querySelector('#store-grid');
  const entries = Array.isArray(store.extensions) ? store.extensions : [];
  if (!entries.length) { grid.innerHTML = '<p class="loading-doc">No extensions are published yet.</p>'; return; }
  grid.innerHTML = entries.map(entry => `<article class="store-card"><div class="store-icon">⌘</div><div><p class="store-meta">${escapeHTML(entry.category || 'Extension')} · v${escapeHTML(entry.version || '1.0')}</p><h3>${escapeHTML(entry.name || 'Lima extension')}</h3><p>${escapeHTML(entry.summary || '')}</p><small>by ${escapeHTML(entry.author || 'Lima')}</small></div><a href="${safeHref(entry.downloadURL)}" download>Download <b>↓</b></a></article>`).join('');
}).catch(() => { document.querySelector('#store-grid').innerHTML = '<p class="loading-doc">The extension store is temporarily unavailable.</p>'; });

document.querySelector('#copy-ai-kit').addEventListener('click', async () => {
  const status=document.querySelector('#copy-status');const button=document.querySelector('#copy-ai-kit');button.disabled=true;status.textContent='Preparing the complete kit…';
  try{
    const resources=[
      ['AI AUTHORING CONTRACT','/docs/EXTENSION_AUTHORING_FOR_AI.md'],
      ['MANIFEST JSON SCHEMA','/docs/extension-manifest.schema.json'],
      ['COPY-READY STARTER MANIFEST','/docs/starter-extension/manifest.json']
    ];
    const [guide, ...localContents] = await Promise.all([
      guidePromise.then(value=>`\n\n===== HUMAN BUILDER GUIDE · ${value.repository}/${value.branch}/${value.path} =====\n\n${value.content}`),
      ...resources.map(async([title,url])=>{const response=await fetch(url);if(!response.ok)throw new Error(url);return `\n\n===== ${title} =====\n\n${await response.text()}`;})
    ]);
    const contents=[guide, ...localContents];
    const prompt=`LIMA EXTENSION DEVELOPMENT PACKET\n\nEXTENSION REQUEST\nReplace this line with the exact extension you want built.\n\nDELIVERY INSTRUCTION\nBuild the specified Lima extension using only the public contract below. Do not invent fields or actions. Return the finished directory tree and complete contents of every file, then include the final AI handoff packet required by the contract.`;
    await navigator.clipboard.writeText(prompt+contents.join(''));
    status.textContent='Copied — paste once into an AI with your extension request.';
    window.setTimeout(()=>{status.textContent='';},7000);
  }catch{status.textContent='Could not copy. Download the four resources instead.';}finally{button.disabled=false;}
});
