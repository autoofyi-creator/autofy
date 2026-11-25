(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = '919366065001';
  const NOTIFY = 'autoofyi@gmail.com';

  /* Header shadow */
  const bar = $('#bar');
  const onScroll = () => bar.classList.toggle('is-stuck', scrollY > 8);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  const menu = $('#menu'), btn = $('#menuBtn');
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

  /* Reveal on scroll */
  const rev = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08, rootMargin: '0px 0px -4% 0px' });
    rev.forEach(el => io.observe(el));
  } else rev.forEach(el => el.classList.add('in'));

  /* Concept tabs (without JS all three panels simply show one after another) */
  const tabs = $$('.cx__tab');
  function pickTab(t, focus) {
    tabs.forEach(x => {
      const on = x === t;
      x.setAttribute('aria-selected', on);
      x.tabIndex = on ? 0 : -1;
      $('#' + x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
  }
  if (tabs.length) {
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => pickTab(t));
      t.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); pickTab(tabs[(i + k + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); pickTab(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); pickTab(tabs[tabs.length - 1], true); }
      });
    });
    pickTab(tabs[0]);
  }

  /* Copy buttons */
  $$('.copy').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); }
    catch { const t = document.createElement('textarea'); t.value = b.dataset.copy; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
    const old = b.textContent; b.textContent = 'Copied'; b.classList.add('done');
    setTimeout(() => { b.textContent = old; b.classList.remove('done'); }, 1400);
  }));

  /* Live clocks */
  const fmt = tz => new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date());
  function tick() {
    $$('[data-tz]').forEach(el => { el.textContent = fmt(el.dataset.tz); });
    const n = $('#nowTripura'); if (n) n.textContent = fmt('Asia/Kolkata');
  }
  tick(); setInterval(tick, 20000);

  /* WhatsApp request form (used when an APK isn't uploaded yet) */
  const modal = $('#reqModal'), form = $('#reqForm'), msg = $('#reqMsg');
  let product = 'Billing software';
  const okPhone = p => p.replace(/\D/g, '').length >= 7 && /^\+?[0-9\s\-().]{7,30}$/.test(p);
  function openReq(p) { product = p; msg.textContent = ''; modal.showModal ? modal.showModal() : modal.setAttribute('open', ''); }
  $('#reqClose').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
  form.addEventListener('submit', async e => {
    e.preventDefault(); msg.textContent = '';
    const fd = new FormData(form), name = (fd.get('name') || '').trim(), phone = (fd.get('phone') || '').trim();
    if (!name) return (msg.textContent = 'Please enter your name.');
    if (!okPhone(phone)) return (msg.textContent = 'Please enter a valid number with country code, like +1 555 123 4567.');
    const url = `https://wa.me/${WA}?text=` + encodeURIComponent(`Hi Autofy, I'd like the ${product} demo. My name is ${name} and my number is ${phone}.`);
    const w = window.open('', '_blank');
    const b = $('#reqBtn'); b.disabled = true;
    await sendLead({ name, phone, product, website: fd.get('website') || '' });
    b.disabled = false; modal.close(); form.reset();
    if (w) w.location.href = url; else location.href = url;
  });
  async function sendLead(d) {
    try { const r = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); if (r.ok || r.status === 400) return; } catch {}
    try {
      await fetch('https://formsubmit.co/ajax/' + NOTIFY, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: `${d.product} request: ${d.name} (${d.phone})`, _captcha: 'false', _template: 'table', Name: d.name, Phone: d.phone, Product: d.product }) });
    } catch {}
  }

  /* APK buttons: if a file isn't uploaded yet, send the visitor to WhatsApp instead of a dead link */
  $$('[data-apk]').forEach(a => {
    fetch(a.getAttribute('href'), { method: 'HEAD' }).then(r => { if (!r.ok) throw 0; }).catch(() => {
      a.removeAttribute('download'); a.setAttribute('href', '#');
      a.textContent = 'Get it on WhatsApp';
      const name = a.closest('.card').querySelector('h3').textContent;
      a.addEventListener('click', e => { e.preventDefault(); openReq(name); });
    });
  });

  /* Calendly embed, loaded when the booking section is near */
  const cal = $('#calFrame');
  let loaded = false;
  function loadCal() {
    if (loaded) return; loaded = true;
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://assets.calendly.com/assets/external/widget.css'; document.head.append(css);
    const s = document.createElement('script'); s.src = 'https://assets.calendly.com/assets/external/widget.js'; s.async = true;
    s.onerror = () => cal.classList.add('failed');
    document.body.append(s);
    let tries = 0;
    const t = setInterval(() => {
      if ($('iframe', cal)) { cal.classList.add('loaded'); clearInterval(t); }
      else if (++tries > 20) { cal.classList.add('failed'); clearInterval(t); }
    }, 500);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { loadCal(); o.disconnect(); } }, { rootMargin: '800px 0px' }).observe(cal);
  } else loadCal();

  /* Mobile dock: appears after the hero, hides while the booking section is on screen */
  const dock = $('#dock'), book = $('#book');
  const upd = () => {
    const r = book.getBoundingClientRect();
    dock.classList.toggle('show', scrollY > 420 && !(r.top < innerHeight * .85 && r.bottom > 0));
  };
  addEventListener('scroll', upd, { passive: true }); upd();

  $('#yr').textContent = new Date().getFullYear();
})();
