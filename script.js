/* Botanical scene motion, accessible scroll reveals, and section-aware navigation. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('js');

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

  /* Keep the navigation oriented around the most visible primary section. */
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
    const navObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activateLink(visible.target.id);
    }, { rootMargin: '-20% 0px -58% 0px', threshold: [0.12, 0.35, 0.62] });

    navSections.forEach((section) => navObserver.observe(section));
  } else {
    activateLink(navSections[0]?.id || 'work');
  }

  const scenes = [...document.querySelectorAll('[data-scroll-scene]')];
  const revealTargets = [...document.querySelectorAll('[data-scroll-reveal]')];

  revealTargets.forEach((target, index) => {
    target.style.setProperty('--reveal-delay', `${Math.min((index % 7) * 72, 360)}ms`);
  });

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-in-view', entry.isIntersecting);
      });
    }, { rootMargin: '-12% 0px -12% 0px', threshold: [0.12, 0.3, 0.55] });

    scenes.forEach((scene) => sceneObserver.observe(scene));

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.16 });

    revealTargets.forEach((target) => revealObserver.observe(target));
  } else {
    scenes.forEach((scene) => scene.classList.add('is-in-view'));
    revealTargets.forEach((target) => target.classList.add('is-revealed'));
  }

  /* Trail links use smooth, section-aligned movement without trapping ordinary navigation. */
  document.querySelectorAll('[data-scroll-next]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const selector = link.getAttribute('href');
      const target = selector ? document.querySelector(selector) : null;
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion.matches ? 'auto' : 'smooth',
        block: 'start',
      });
      window.history.replaceState(null, '', selector);
    });
  });
})();
