(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const bar = $('#bar'), menu = $('#menu'), btn = $('#menuBtn'), dock = $('#dock');

  const onScroll = () => {
    bar.classList.toggle('is-stuck', scrollY > 8);
    if (dock) dock.classList.toggle('show', scrollY > 420);
  };
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    menu.hidden = !open; btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('noscroll', open);
    if (open) bar.classList.add('is-stuck'); else onScroll();
  }
  btn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  matchMedia('(min-width:1040px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  const y = $('#yr'); if (y) y.textContent = new Date().getFullYear();
})();
