(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ───────── Config (edit here) ───────── */
  const CFG = {
    notifyEmail: 'autoofyi@gmail.com',
    // Availability in India Standard Time (IST, UTC+5:30), Mon–Fri
    istStartMin: 17 * 60,        // first slot 5:00 PM IST  (~6:30 AM US Eastern)
    istEndMin: 23 * 60,          // last slot  11:00 PM IST (~12:30 PM US Eastern)
    slotMin: 30,
    daysAhead: 21,
    leadHours: 12,               // earliest bookable = now + 12h
    weekdaysIST: [1, 2, 3, 4, 5],
  };
  const IST = 330;

  /* ───────── Nav ───────── */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 12);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  burger.addEventListener('click', () => {
    const o = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
  });
  links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

  /* ───────── Reveal on scroll ───────── */
  const revealEls = $$('.reveal, .display');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('in'));
  requestAnimationFrame(() => $('.display')?.classList.add('in'));

  /* ───────── Phone screen cycling ───────── */
  $$('[data-cycle]').forEach(box => {
    const imgs = $$('img', box); let i = 0;
    imgs[0].classList.add('on');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const every = +box.dataset.interval || 2800;
    setInterval(() => {
      imgs[i].classList.remove('on'); i = (i + 1) % imgs.length; imgs[i].classList.add('on');
    }, every);
  });

  /* ───────── Copy buttons ───────── */
  $$('.copy').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); }
    catch { const t = document.createElement('textarea'); t.value = b.dataset.copy; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
    const old = b.textContent; b.textContent = 'Copied'; b.classList.add('done');
    setTimeout(() => { b.textContent = old; b.classList.remove('done'); }, 1400);
  }));

  /* ───────── WhatsApp request modal ───────── */
  const WA = '919366065001';
  const modal = $('#reqModal'), reqForm = $('#reqForm'), reqMsg = $('#reqMsg');
  let reqProduct = 'Billing software';
  const okPhone = p => p.replace(/\D/g, '').length >= 7 && /^\+?[0-9\s\-().]{7,30}$/.test(p);
  function openReq(product) {
    reqProduct = product; $('#reqKind').textContent = product + ' demo'; reqMsg.textContent = '';
    modal.showModal ? modal.showModal() : modal.setAttribute('open', '');
  }
  $('#reqClose').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
  reqForm.addEventListener('submit', async e => {
    e.preventDefault(); reqMsg.textContent = '';
    const fd = new FormData(reqForm), name = (fd.get('name') || '').trim(), phone = (fd.get('phone') || '').trim();
    if (!name) return (reqMsg.textContent = 'Please enter your name.');
    if (!okPhone(phone)) return (reqMsg.textContent = 'Please enter a valid number with country code, e.g. +1 555 123 4567.');
    const waText = `Hi Autofy, I'd like the ${reqProduct} demo. My name is ${name} and my number is ${phone}.`;
    const waUrl = `https://wa.me/${WA}?text=${encodeURIComponent(waText)}`;
    const w = window.open('', '_blank');           // open synchronously so popup blockers allow it
    const b = $('#reqBtn'); b.disabled = true;
    await sendLead({ name, phone, product: reqProduct, website: fd.get('website') || '' });
    b.disabled = false; modal.close(); reqForm.reset();
    if (w) w.location.href = waUrl; else location.href = waUrl;
  });
  async function sendLead(d) {
    try { const r = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); if (r.ok || r.status === 400) return; } catch {}
    try {
      await fetch('https://formsubmit.co/ajax/' + CFG.notifyEmail, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: `${d.product} request: ${d.name} (${d.phone})`, _captcha: 'false', _template: 'table', Name: d.name, Phone: d.phone, Product: d.product }) });
    } catch {}
  }

  /* ───────── APK availability: if file isn't uploaded yet, show a graceful state ───────── */
  $$('[data-apk]').forEach(a => {
    fetch(a.getAttribute('href'), { method: 'HEAD' }).then(r => {
      if (!r.ok) throw 0;
    }).catch(() => {
      a.removeAttribute('download'); a.setAttribute('href', '#');
      a.innerHTML = 'Get it on WhatsApp <span class="arr">→</span>';
      a.addEventListener('click', e => { e.preventDefault(); openReq(a.closest('.demo__body').querySelector('.h3').textContent); });
    });
  });

  const sc = $('#stickyCta'), bkSec = $('#book');
  const upd = () => { const r = bkSec.getBoundingClientRect(); sc.classList.toggle('show', scrollY > 500 && !(r.top < innerHeight && r.bottom > 0)); };
  addEventListener('scroll', upd, { passive: true }); upd();

  $('#yr').textContent = new Date().getFullYear();

  /* ───────── Native booking ───────── */
  const bk = $('#bk');
  if (bk) {
    const pad = n => String(n).padStart(2, '0');
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    const COMMON = ['America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York', 'America/Toronto', 'America/Sao_Paulo', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland'];
    let zones = COMMON.slice();
    try { if (Intl.supportedValuesOf) zones = Intl.supportedValuesOf('timeZone'); } catch {}
    if (!zones.includes(detected)) zones.unshift(detected);
    let tz = detected;

    const tzSel = $('#bkTz');
    const offLabel = z => { try { return new Intl.DateTimeFormat('en-US', { timeZone: z, timeZoneName: 'short' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName').value; } catch { return ''; } };
    tzSel.innerHTML = zones.map(z => `<option value="${z}">${z.replace(/_/g, ' ').replace('/', ' / ')} (${offLabel(z)})</option>`).join('');
    tzSel.value = tz;

    /* build all bookable instants (UTC ms) from the IST schedule */
    const allSlots = [];
    (function build() {
      const now = Date.now(), earliest = now + CFG.leadHours * 36e5;
      const istNow = new Date(now + IST * 6e4);
      for (let d = 0; d <= CFG.daysAhead + 1; d++) {
        const day = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + d));
        if (!CFG.weekdaysIST.includes(day.getUTCDay())) continue;
        for (let m = CFG.istStartMin; m < CFG.istEndMin; m += CFG.slotMin) {
          const t = day.getTime() + m * 6e4 - IST * 6e4;
          if (t >= earliest && t <= now + CFG.daysAhead * 864e5) allSlots.push(t);
        }
      }
    })();

    const keyOf = (t, z) => { const p = new Intl.DateTimeFormat('en-CA', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t); return p; }; // YYYY-MM-DD
    let byDay = {};
    const regroup = () => { byDay = {}; allSlots.forEach(t => (byDay[keyOf(t, tz)] ||= []).push(t)); };
    regroup();

    const fmtTime = t => new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(t);
    const fmtLong = t => new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric' }).format(t);

    const grid = $('#bkGrid'), monthEl = $('#bkMonth'), slotsEl = $('#bkSlots'), dayLabel = $('#bkDayLabel'), cont = $('#bkContinue');
    const keys = () => Object.keys(byDay).sort();
    let view = null;      // {y, m}
    let selDay = null, selTime = null;

    const setView = k => { const [y, m] = k.split('-').map(Number); view = { y, m: m - 1 }; };
    const todayKey = () => keyOf(Date.now(), tz);

    function renderCal() {
      const { y, m } = view;
      monthEl.textContent = new Date(Date.UTC(y, m, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      const first = new Date(Date.UTC(y, m, 1)), lead = (first.getUTCDay() + 6) % 7, dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      let html = '';
      for (let i = 0; i < lead; i++) html += '<span></span>';
      const tk = todayKey();
      for (let d = 1; d <= dim; d++) {
        const k = `${y}-${pad(m + 1)}-${pad(d)}`, ok = !!byDay[k];
        html += `<button type="button" class="bk__d${ok ? ' ok' : ''}${k === selDay ? ' sel' : ''}${k === tk ? ' today' : ''}" data-k="${k}"${ok ? '' : ' disabled'} aria-label="${k}"${k === selDay ? ' aria-pressed="true"' : ''}>${d}</button>`;
      }
      grid.innerHTML = html;
      const ks = keys(), a = ks[0] && ks[0].slice(0, 7), z = ks.length && ks[ks.length - 1].slice(0, 7), cur = `${y}-${pad(m + 1)}`;
      $('#bkPrev').disabled = !a || cur <= a;
      $('#bkNext').disabled = !z || cur >= z;
    }

    function renderSlots() {
      if (!selDay) { dayLabel.textContent = 'Select a date'; slotsEl.innerHTML = '<p class="bk__empty">Pick a day on the calendar to see open times.</p>'; return; }
      const list = byDay[selDay] || [];
      dayLabel.textContent = fmtLong(list[0] || Date.now());
      slotsEl.innerHTML = list.map((t, i) => `<button type="button" class="bk__slot" role="option" data-t="${t}" style="animation-delay:${Math.min(i, 12) * 25}ms" aria-selected="${t === selTime}">${fmtTime(t)}</button>`).join('') || '<p class="bk__empty">No times this day.</p>';
    }

    function summary() {
      const box = $('#bkSummary');
      if (selTime) {
        $('#bkSumDate').textContent = fmtLong(selTime);
        const end = selTime + CFG.slotMin * 6e4;
        $('#bkSumTime').textContent = `${fmtTime(selTime)} – ${fmtTime(end)} · ${tz.replace(/_/g, ' ')}`;
        box.hidden = false;
      } else box.hidden = true;
      cont.disabled = !selTime;
    }

    grid.addEventListener('click', e => {
      const b = e.target.closest('.bk__d.ok'); if (!b) return;
      selDay = b.dataset.k; selTime = null; renderCal(); renderSlots(); summary();
    });
    slotsEl.addEventListener('click', e => {
      const b = e.target.closest('.bk__slot'); if (!b) return;
      selTime = +b.dataset.t;
      $$('.bk__slot', slotsEl).forEach(x => x.setAttribute('aria-selected', x === b));
      summary();
    });
    $('#bkPrev').addEventListener('click', () => { view.m--; if (view.m < 0) { view.m = 11; view.y--; } renderCal(); });
    $('#bkNext').addEventListener('click', () => { view.m++; if (view.m > 11) { view.m = 0; view.y++; } renderCal(); });
    tzSel.addEventListener('change', () => {
      tz = tzSel.value; selDay = null; selTime = null; regroup();
      const ks = keys(); if (ks.length) setView(ks[0]);
      renderCal(); renderSlots(); summary();
    });

    /* steps */
    const panes = { 1: $('#bkPick'), 2: $('#bkForm'), 3: $('#bkDone') };
    function go(n) {
      Object.entries(panes).forEach(([k, p]) => p.classList.toggle('on', +k === n));
      $$('.bk__steps li', bk).forEach((li, i) => { li.classList.toggle('on', i === n - 1); li.classList.toggle('done', i < n - 1); });
      if (n === 2) setTimeout(() => $('input[name=name]', bk).focus({ preventScroll: true }), 50);
      const top = bk.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * .5) bk.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    cont.addEventListener('click', () => selTime && go(2));
    $('#bkBack').addEventListener('click', () => go(1));
    $('#bkAgain').addEventListener('click', () => { selDay = null; selTime = null; $('#bkFormEl').reset(); regroup(); const ks = keys(); if (ks.length) setView(ks[0]); renderCal(); renderSlots(); summary(); go(1); });

    /* submit */
    const form = $('#bkFormEl'), msg = $('#bkMsg'), sbtn = $('#bkSubmit');
    const okMail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    form.addEventListener('submit', async e => {
      e.preventDefault(); msg.textContent = '';
      if (!selTime) return go(1);
      const fd = new FormData(form), name = (fd.get('name') || '').trim(), email = (fd.get('email') || '').trim(), phone = (fd.get('phone') || '').trim();
      if (!name) return (msg.textContent = 'Please enter your name.');
      if (!okMail(email)) return (msg.textContent = 'Please enter a valid email so we can send the invite.');
      if (phone && !okPhone(phone)) return (msg.textContent = 'Phone looks off. Include the country code, e.g. +1 555 123 4567.');
      const payload = { name, email, phone, topics: fd.getAll('topic'), note: (fd.get('note') || '').trim(), start: new Date(selTime).toISOString(), durationMin: CFG.slotMin, tz, website: fd.get('website') || '' };
      sbtn.disabled = true; const old = sbtn.innerHTML; sbtn.textContent = 'Booking…';
      const ok = await sendBooking(payload);
      sbtn.disabled = false; sbtn.innerHTML = old;
      if (!ok) return (msg.innerHTML = 'Couldn’t send just now. Please try again, or <a href="https://wa.me/' + WA + '?text=' + encodeURIComponent(`Hi Autofy, I'd like to book a call on ${fmtLong(selTime)} at ${fmtTime(selTime)} (${tz}). I'm ${name}.`) + '" target="_blank" rel="noopener" style="color:#fff">message us on WhatsApp</a>.');
      $('#bkDoneTxt').innerHTML = `<b>${fmtLong(selTime)}</b><br>${fmtTime(selTime)} – ${fmtTime(selTime + CFG.slotMin * 6e4)} (${tz.replace(/_/g, ' ')})<br><br>A confirmation with the video link is on its way to <b></b>.`;
      $('#bkDoneTxt b:last-of-type').textContent = email;
      const stamp = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Autofy//Booking//EN', 'BEGIN:VEVENT', `UID:${selTime}@autofy`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(selTime)}`, `DTEND:${stamp(selTime + CFG.slotMin * 6e4)}`, 'SUMMARY:Autofy intro call', 'DESCRIPTION:30-minute intro call with Autofy. We will email the video link.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      $('#bkIcs').href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      go(3);
    });
    async function sendBooking(d) {
      try { const r = await fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); if (r.ok) return true; if (r.status === 400) { const j = await r.json().catch(() => ({})); msg.textContent = j.error || 'Please check your details.'; return null; } } catch {}
      try {
        const when = `${fmtLong(selTime)} ${fmtTime(selTime)} (${d.tz})`;
        const r = await fetch('https://formsubmit.co/ajax/' + CFG.notifyEmail, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ _subject: `Call booking: ${d.name} · ${when}`, _captcha: 'false', _template: 'table', _replyto: d.email, Name: d.name, Email: d.email, Phone: d.phone || '-', When: when, 'When (UTC)': d.start, Topics: d.topics.join(', ') || '-', Note: d.note || '-' }) });
        return r.ok;
      } catch { return false; }
    }

    /* init */
    const ks = keys();
    if (ks.length) { setView(ks[0]); renderCal(); } else { monthEl.textContent = 'No times available'; }
    summary();
  }
})();
