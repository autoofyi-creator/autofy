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

  /* Testimonials: only real entries from /data/testimonials.json are shown */
  fetch('/data/testimonials.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : []).then(list => {
    if (!Array.isArray(list) || !list.length) return;
    const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    $('#voicesGrid').innerHTML = list.slice(0, 6).map(t => `<figure class="voice reveal in"><blockquote>“${esc(t.quote)}”</blockquote><figcaption><b>${esc(t.name)}</b>${esc([t.role, t.company].filter(Boolean).join(', '))}${t.url ? ` · <a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.source || 'Source')}</a>` : ''}</figcaption></figure>`).join('');
    $('#voicesLead').textContent = 'Words from people who have used our work, published with their permission.';
  }).catch(() => {});

  /* Review form: goes to us for approval, never published automatically */
  const rm = $('#revModal'), rf = $('#revForm'), rmsg = $('#revMsg');
  $('#openReview').addEventListener('click', () => { rmsg.textContent = ''; rm.showModal ? rm.showModal() : rm.setAttribute('open', ''); });
  $('#revClose').addEventListener('click', () => rm.close());
  rm.addEventListener('click', e => { if (e.target === rm) rm.close(); });
  rf.addEventListener('submit', async e => {
    e.preventDefault(); rmsg.textContent = '';
    const fd = new FormData(rf), d = Object.fromEntries(fd.entries()); d.consent = !!fd.get('consent');
    if (!d.name.trim() || (d.review || '').trim().length < 10) return (rmsg.textContent = 'Please add your name and a few words about your experience.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((d.email || '').trim())) return (rmsg.textContent = 'Please enter a valid email so we can verify it’s you.');
    if (!d.consent) return (rmsg.textContent = 'Please tick the box to let us publish your review.');
    const b = $('#revBtn'); b.disabled = true; b.textContent = 'Sending…';
    let ok = false;
    try { const r = await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); ok = r.ok; if (r.status === 400) { rmsg.textContent = (await r.json().catch(() => ({}))).error || 'Please check your details.'; b.disabled = false; b.textContent = 'Send review'; return; } } catch {}
    if (!ok) {
      try {
        const r = await fetch('https://formsubmit.co/ajax/' + NOTIFY, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ _subject: `New review (${d.rating}/5) from ${d.name}`, _captcha: 'false', _template: 'table', _replyto: d.email, Name: d.name, Role: d.role, Rating: d.rating, Project: d.project, Review: d.review, Email: d.email, 'Permission to publish': 'yes' }) });
        ok = r.ok;
      } catch {}
    }
    b.disabled = false; b.textContent = 'Send review';
    if (!ok) return (rmsg.textContent = 'Could not send right now. Please email info@autofyy.online instead.');
    rf.reset(); rm.close(); alert('Thank you. We’ve received your review and will be in touch by email.');
  });

  $('#yr').textContent = new Date().getFullYear();
})();
