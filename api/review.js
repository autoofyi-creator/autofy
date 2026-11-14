// POST /api/review: a visitor submits a review for approval. Emailed to you; nothing is published automatically.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }
  if (!process.env.RESEND_API_KEY) return res.status(501).json({ ok: false });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } } b = b || {};
  if (b.website) return res.status(200).json({ ok: true });
  const g = (k, n) => String(b[k] || '').trim().slice(0, n);
  const name = g('name', 120), role = g('role', 160), project = g('project', 160), review = g('review', 1200), email = g('email', 200);
  const rating = Math.min(5, Math.max(1, parseInt(b.rating, 10) || 5));
  if (!name || review.length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !b.consent) {
    return res.status(400).json({ ok: false, error: 'Please fill in your name, email and review, and tick the permission box.' });
  }
  const to = process.env.TO_EMAIL || 'autoofyi@gmail.com';
  const from = process.env.FROM_EMAIL || 'Autofy Bookings <onboarding@resend.dev>';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: email, subject: `New review (${rating}/5) from ${name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;padding:24px"><b style="color:#0071e3">NEW REVIEW, NEEDS YOUR APPROVAL</b><h2 style="margin:8px 0">${esc(name)}${role ? ', ' + esc(role) : ''}</h2><p>Rating: <b>${rating}/5</b> &middot; Project: ${esc(project) || '-'}</p><blockquote style="border-left:3px solid #0071e3;margin:16px 0;padding-left:14px">${esc(review).replace(/\n/g, '<br>')}</blockquote><p>Email: ${esc(email)}<br>Permission to publish: yes</p></div>` }),
  }).catch(() => null);
  if (!r || !r.ok) return res.status(502).json({ ok: false });
  return res.status(200).json({ ok: true });
};
