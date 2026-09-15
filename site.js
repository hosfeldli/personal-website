'use strict';
const menu = document.querySelector('.mobile-menu-button');
const nav = document.querySelector('#global-nav');
menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', String(!open)); nav?.classList.toggle('open', !open); });
