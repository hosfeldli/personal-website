(() => {
  const releaseLabel = document.querySelector('#release-label');
  const releaseVersion = document.querySelector('#release-version');
  const releaseDate = document.querySelector('#release-date');
  const releaseNotes = document.querySelector('#release-notes');
  const downloadLinks = document.querySelectorAll('#hero-download, #header-download, #install-download');
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
    .catch(() => { releaseVersion.textContent = 'LiamFlow for macOS'; releaseDate.textContent = 'Download includes the app and installer.'; });
  document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
    const destination = document.querySelector(link.getAttribute('href'));
    if (!destination) return;
    event.preventDefault();
    destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
})();
