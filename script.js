/* Small visual enhancements and measured interactions. */
(() => {
  'use strict';

  document.documentElement.classList.add('js');

  /* Technical notes popout. */
  const trigger = document.querySelector('#site-build-trigger');
  const dialog = document.querySelector('#site-build-dialog');
  if (trigger && dialog) {
    trigger.addEventListener('click', () => {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog && typeof dialog.close === 'function') dialog.close();
    });
  }

  /* Keep the long-page navigation oriented around the section currently in view. */
  const navLinks = [...document.querySelectorAll('[data-nav-link]')];
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const activateLink = (sectionId) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${sectionId}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  if ('IntersectionObserver' in window && navSections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activateLink(visible.target.id);
    }, { rootMargin: '-18% 0px -66% 0px', threshold: [0, .25, .5] });

    navSections.forEach((section) => observer.observe(section));
  } else {
    activateLink(navSections[0]?.id || 'work');
  }
})();
