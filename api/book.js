// POST /api/book : a visitor picked a time slot on the website.
// Emails you the request and (optionally) a confirmation + calendar invite to the visitor.
// Env vars: RESEND_API_KEY (required), TO_EMAIL, FROM_EMAIL (optional).
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }
  if (!process.env.RESEND_API_KEY) return res.status(501).json({ ok: false, error: 'Email service not configured' });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } } b = b || {};
  if (b.website) return res.status(200).json({ ok: true });

  const name = String(b.name || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().slice(0, 160);
  const phone = String(b.phone || '').trim().slice(0, 30);
  const note = String(b.note || '').trim().slice(0, 1000);
  const tz = String(b.tz || 'UTC').slice(0, 60);
  const topics = Array.isArray(b.topics) ? b.topics.slice(0, 6).map((t) => String(t).slice(0, 40)) : [];
  const start = new Date(b.start);
  const dur = Math.min(Math.max(parseInt(b.durationMin, 10) || 30, 15), 120);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ ok: false, error: 'Please enter your name and a valid email.' });
  if (isNaN(start) || start.getTime() < Date.now() || start.getTime() > Date.now() + 60 * 864e5) return res.status(400).json({ ok: false, error: 'That time is no longer available. Please pick another.' });

  let when;
  try { when = new Intl.DateTimeFormat('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'short' }).format(start) + ' (' + tz.replace(/_/g, ' ') + ')'; }
  catch { when = start.toUTCString(); }
  const whenIST = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(start) + ' IST';

  const to = process.env.TO_EMAIL || 'autoofyi@gmail.com';
  const from = process.env.FROM_EMAIL || 'Autofy Bookings <onboarding@resend.dev>';
  const send = (body) => fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);

  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Autofy//Booking//EN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', `UID:${start.getTime()}-${Date.now()}@autofy`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(start.getTime() + dur * 6e4)}`, 'SUMMARY:Autofy intro call', 'DESCRIPTION:30-minute intro call with Autofy.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const attachments = [{ filename: 'autofy-call.ics', content: Buffer.from(ics).toString('base64') }];

  const row = (k, v) => `<tr><td style="padding:6px 16px 6px 0;color:#6e6e73">${k}</td><td style="padding:6px 0"><b>${v}</b></td></tr>`;
  const r = await send({
    from, to: [to], reply_to: email, subject: `Call booked: ${name} · ${whenIST}`, attachments,
    html: `<div style="font-family:Arial,sans-serif;padding:24px;max-width:520px"><b style="color:#0071e3;letter-spacing:.1em;font-size:12px">NEW CALL BOOKING</b><h2 style="margin:8px 0 16px">${esc(name)}</h2><table style="font-size:15px">${row('When', esc(when))}${row('Your time', esc(whenIST))}${row('Email', `<a href="mailto:${esc(email)}">${esc(email)}</a>`)}${phone ? row('Phone', `<a href="https://wa.me/${phone.replace(/\D/g, '')}">${esc(phone)}</a>`) : ''}${topics.length ? row('Needs', esc(topics.join(', '))) : ''}${note ? row('Note', esc(note)) : ''}</table></div>`,
  });
  if (!r || !r.ok) return res.status(502).json({ ok: false, error: 'Could not send right now.' });

  // Best-effort confirmation to the visitor (Resend's test sender only delivers to your own address until you verify a domain)
  await send({
    from, to: [email], reply_to: to, subject: 'Your Autofy call is booked', attachments,
    html: `<div style="font-family:Arial,sans-serif;padding:24px;max-width:520px"><h2 style="margin:0 0 8px">You’re booked, ${esc(name.split(' ')[0])}.</h2><p style="font-size:16px;line-height:1.5">${esc(when)}<br>${dur} minutes</p><p style="color:#6e6e73;font-size:14px;line-height:1.5">We’ll send the video link before the call. Need to change the time? Just reply to this email.</p></div>`,
  });
  return res.status(200).json({ ok: true });
};
