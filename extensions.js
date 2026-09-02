'use strict';
const escapeHTML = (value) => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const inline = (value) => escapeHTML(value)
  .replace(/`([^`]+)`/g,'<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>');
function renderMarkdown(source) {
  const lines=source.replaceAll('\r','').split('\n'); let html='', paragraph=[], list=null, inCode=false, code=[];
  const flushParagraph=()=>{if(paragraph.length){html+=`<p>${inline(paragraph.join(' '))}</p>`;paragraph=[];}};
  const flushList=()=>{if(list){html+=`</${list}>`;list=null;}};
  const headingID=(text)=>text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  for(let i=0;i<lines.length;i+=1){const line=lines[i];
    if(line.startsWith('```')){flushParagraph();flushList();if(inCode){html+=`<pre><code>${escapeHTML(code.join('\n'))}</code></pre>`;code=[];}inCode=!inCode;continue;} if(inCode){code.push(line);continue;}
    const heading=line.match(/^(#{1,3})\s+(.+)$/); if(heading){flushParagraph();flushList();const level=heading[1].length;const id=headingID(heading[2]);html+=`<h${level} id="${id}">${inline(heading[2])}</h${level}>`;continue;}
    if(line.startsWith('|')&&lines[i+1]?.match(/^\|?[\s:|-]+\|/)){flushParagraph();flushList();const rows=[];while(i<lines.length&&lines[i].startsWith('|')){rows.push(lines[i].split('|').slice(1,-1).map(v=>v.trim()));i+=1;}i-=1;const head=rows[0];const body=rows.slice(2);html+='<table><thead><tr>'+head.map(v=>`<th>${inline(v)}</th>`).join('')+'</tr></thead><tbody>'+body.map(row=>'<tr>'+row.map(v=>`<td>${inline(v)}</td>`).join('')+'</tr>').join('')+'</tbody></table>';continue;}
    const bullet=line.match(/^[-*]\s+(.+)$/);const numbered=line.match(/^\d+\.\s+(.+)$/);if(bullet||numbered){flushParagraph();const wanted=bullet?'ul':'ol';if(list!==wanted){flushList();list=wanted;html+=`<${list}>`;}html+=`<li>${inline((bullet||numbered)[1])}</li>`;continue;}
    if(line.startsWith('> ')){flushParagraph();flushList();html+=`<blockquote>${inline(line.slice(2))}</blockquote>`;continue;}
    if(!line.trim()){flushParagraph();flushList();continue;} paragraph.push(line.trim());
  } flushParagraph();flushList();return html;
}
fetch('/docs/EXTENSION_AUTHORING_FOR_AI.md').then(response=>{if(!response.ok)throw new Error('unavailable');return response.text();}).then(markdown=>{
  const article=document.querySelector('#manual-content');article.innerHTML=renderMarkdown(markdown);
  const headings=[...article.querySelectorAll('h2')];document.querySelector('#manual-toc').innerHTML=headings.map(h=>`<a href="#${h.id}">${h.textContent}</a>`).join('');
}).catch(()=>{document.querySelector('#manual-content').innerHTML='<h1>Manual unavailable</h1><p>The bundled documentation could not be loaded. Download the manual from the resource links above or open Extension Development inside Lima.</p>';});

document.querySelector('#copy-ai-kit').addEventListener('click', async () => {
  const status=document.querySelector('#copy-status');const button=document.querySelector('#copy-ai-kit');button.disabled=true;status.textContent='Preparing the complete kit…';
  try{
    const resources=[
      ['AI AUTHORING CONTRACT','/docs/EXTENSION_AUTHORING_FOR_AI.md'],
      ['MANIFEST JSON SCHEMA','/docs/extension-manifest.schema.json'],
      ['HUMAN BUILDER REFERENCE','/docs/EXTENSIONS.md'],
      ['COPY-READY STARTER MANIFEST','/docs/starter-extension/manifest.json']
    ];
    const contents=await Promise.all(resources.map(async([title,url])=>{const response=await fetch(url);if(!response.ok)throw new Error(url);return `\n\n===== ${title} =====\n\n${await response.text()}`;}));
    const prompt=`LIMA EXTENSION DEVELOPMENT PACKET\n\nEXTENSION REQUEST\nReplace this line with the exact extension you want built.\n\nDELIVERY INSTRUCTION\nBuild the specified Lima extension using only the public contract below. Do not invent fields or actions. Return the finished directory tree and complete contents of every file, then include the final AI handoff packet required by the contract.`;
    await navigator.clipboard.writeText(prompt+contents.join(''));
    status.textContent='Copied — paste once into an AI with your extension request.';
    window.setTimeout(()=>{status.textContent='';},7000);
  }catch{status.textContent='Could not copy. Download the four resources instead.';}finally{button.disabled=false;}
});
