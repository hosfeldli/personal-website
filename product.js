'use strict';

const launcher = document.querySelector('[data-site-launcher]');

if (launcher) {
  const query = launcher.querySelector('#site-launcher-query');
  const results = Array.from(launcher.querySelectorAll('.launcher-result[data-target]'));
  const empty = launcher.querySelector('.launcher-empty');
  const count = launcher.querySelector('[data-result-count]');
  const open = launcher.querySelector('#site-launcher-open');
  const previewIcon = launcher.querySelector('[data-preview-icon]');
  const previewTitle = launcher.querySelector('[data-preview-title]');
  const previewDetail = launcher.querySelector('[data-preview-detail]');
  let selected = 0;

  const visibleResults = () => results.filter((result) => !result.hidden);

  const navigate = (result) => {
    if (result?.dataset.target) window.location.assign(result.dataset.target);
  };

  const select = (index) => {
    const visible = visibleResults();
    if (!visible.length) {
      selected = -1;
      empty.hidden = false;
      open.hidden = true;
      count.textContent = 'No results';
      return;
    }

    selected = (index + visible.length) % visible.length;
    const active = visible[selected];
    results.forEach((result) => result.classList.toggle('selected', result === active));
    previewIcon.textContent = active.dataset.icon || '⌕';
    previewTitle.textContent = active.dataset.title || '';
    previewDetail.textContent = active.dataset.detail || '';
    empty.hidden = true;
    open.hidden = false;
    count.textContent = `${visible.length} result${visible.length === 1 ? '' : 's'}`;
  };

  const filter = () => {
    const terms = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    results.forEach((result) => {
      const haystack = [result.dataset.title, result.dataset.search].join(' ').toLowerCase();
      result.hidden = !terms.every((term) => haystack.includes(term));
    });
    select(0);
  };

  query.addEventListener('input', filter);
  query.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      select(selected + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      navigate(visibleResults()[selected]);
    } else if (event.key === 'Escape') {
      if (query.value) {
        query.value = '';
        filter();
      } else {
        query.blur();
      }
    }
  });

  results.forEach((result) => {
    result.addEventListener('pointerenter', () => {
      const index = visibleResults().indexOf(result);
      if (index >= 0) select(index);
    });
    result.addEventListener('click', () => navigate(result));
  });

  open.addEventListener('click', () => navigate(visibleResults()[selected]));
  select(0);
}
