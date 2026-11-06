// POST /api/lead : someone asked for a demo (e.g. the billing app) and left their number.
// Uses the same env vars as /api/book (RESEND_API_KEY, TO_EMAIL, FROM_EMAIL).
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }
  if (!process.env.RESEND_API_KEY) return res.status(501).json({ ok: false, error: 'Email service not configured' });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } } b = b || {};
  if (b.website) return res.status(200).json({ ok: true });
  const name = String(b.name || '').trim().slice(0, 120);
  const phone = String(b.phone || '').trim().slice(0, 30);
  const product = String(b.product || 'Demo').trim().slice(0, 80);
  if (!name || phone.replace(/\D/g, '').length < 7 || !/^\+?[0-9\s\-().]{7,30}$/.test(phone)) {
    return res.status(400).json({ ok: false, error: 'Please enter your name and a valid phone / WhatsApp number with country code.' });
  }
  const to = process.env.TO_EMAIL || 'autoofyi@gmail.com';
  const from = process.env.FROM_EMAIL || 'Autofy Bookings <onboarding@resend.dev>';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: [to], subject: `${product} request: ${name} (${phone})`,
      html: `<div style="font-family:Arial,sans-serif;padding:24px;max-width:480px"><b style="color:#0071e3;letter-spacing:.1em;font-size:12px">NEW ${esc(product).toUpperCase()} REQUEST</b><h2 style="margin:8px 0">${esc(name)}</h2><p>Phone / WhatsApp: <a href="https://wa.me/${phone.replace(/\D/g, '')}">${esc(phone)}</a></p></div>`,
    }),
  }).catch(() => null);
  if (!r || !r.ok) return res.status(502).json({ ok: false, error: 'Could not send right now.' });
  return res.status(200).json({ ok: true });
};
