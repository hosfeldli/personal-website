/* Visual behavior is intentionally restrained. Interaction measurement lives in analytics.js. */

/* Technical notes popout. */
(() => {
  const trigger = document.querySelector('#site-build-trigger');
  const dialog = document.querySelector('#site-build-dialog');
  if (!trigger || !dialog) return;

  trigger.addEventListener('click', () => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && typeof dialog.close === 'function') dialog.close();
  });
})();
