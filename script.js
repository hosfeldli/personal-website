(() => {
  const releaseLabel = document.querySelector('#release-label');
  const releaseVersion = document.querySelector('#release-version');
  const releaseDate = document.querySelector('#release-date');
  const releaseNotes = document.querySelector('#release-notes');
  const downloadLinks = document.querySelectorAll('#hero-download, #header-download, #install-download, #final-download');
  const tourContent = document.querySelector('#tour-content');
  const tourBreadcrumb = document.querySelector('#tour-breadcrumb');
  const tours = {
    capture: { breadcrumb: 'Quick Note', kicker: 'Capture', title: 'Keep the thought. Keep your place.', body: 'Press your shortcut, write, and dismiss. The note remains local and ready when you return.', visual: '<div class="tour-note"><span>Today, 9:42 AM</span><b>Make the common path feel effortless.</b><i></i><i></i></div>' },
    write: { breadcrumb: 'Writing Review', kicker: 'Write', title: 'Correct the selection, not your flow.', body: 'Lima reads the text you selected, shows the proposed correction, and replaces that exact range when you approve.', visual: '<div class="tour-rewrite"><span>Before&nbsp; · &nbsp;<s>the report need review</s></span><b>After&nbsp; · &nbsp;The report needs review.</b></div>' },
    meet: { breadcrumb: 'Meeting Note', kicker: 'Meet', title: 'Turn the room into structured notes.', body: 'Long-running, segmented local dictation keeps recording while Lima separates pauses and speaker turns.', visual: '<div class="tour-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><span>Recording locally · 18:42</span></div>' },
    build: { breadcrumb: 'Developer Tools', kicker: 'Build', title: 'Keep small tools within reach.', body: 'Run terminal commands, inspect requests, launch files, format data, and open focused workspaces from the same surface.', visual: '<div class="tour-terminal"><span>lima ~/project</span><b>$ npm run test</b><em>24 passed · ready</em></div>' }
  };
  document.querySelectorAll('.tour-tab').forEach((tab) => tab.addEventListener('click', () => {
    const tour = tours[tab.dataset.tour];
    if (!tour || !tourContent) return;
    document.querySelectorAll('.tour-tab').forEach((item) => { item.classList.toggle('active', item === tab); item.setAttribute('aria-selected', String(item === tab)); });
    tourBreadcrumb.textContent = tour.breadcrumb;
    tourContent.classList.remove('tour-enter');
    requestAnimationFrame(() => { tourContent.innerHTML = `<span class="tour-kicker">${tour.kicker}</span><h3>${tour.title}</h3><p>${tour.body}</p>${tour.visual}`; tourContent.classList.add('tour-enter'); });
  }));
  const displayDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? 'Download includes the app and installer.' : `Published ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)}`;
  };
  fetch('/updates/latest.json', { headers: { Accept: 'application/json' } })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Release unavailable')))
    .then((release) => {
      const version = release.version || 'Latest release';
      releaseVersion.textContent = version;
      releaseDate.textContent = displayDate(release.publishedAt);
      releaseLabel.textContent = `${version} · Apple silicon · macOS 13+`;
      if (release.releaseUrl) releaseNotes.href = release.releaseUrl;
      if (release.dmg) downloadLinks.forEach((link) => { link.href = release.dmg; });
    })
    .catch(() => { releaseVersion.textContent = 'Lima for macOS'; releaseDate.textContent = 'Download includes the ready-to-drag app.'; });
  document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
    const destination = document.querySelector(link.getAttribute('href'));
    if (!destination) return;
    event.preventDefault();
    destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
})();
